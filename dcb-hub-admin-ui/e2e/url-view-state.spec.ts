import type { Page } from "@playwright/test";
import { test, expect } from "./fixtures/test";
import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import { MOCKS } from "./fixtures/routes";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import libraries from "./fixtures-data/libraries.json";
import locations from "./fixtures-data/locations.json";
import patronRequests from "./fixtures-data/patron-requests.json";
import libraryDetail from "./fixtures-data/library-detail.json";

/**
 * A grid's view in its URL: docs/url-view-state.md. /patronRequests/all is the first grid on
 * it. Each test checks what the grid ASKED the server for, not only what it shows, because
 * the rows here are fixtures and look the same whatever was asked.
 */

interface DashboardVariables {
	allQuery: string;
	pageno: number;
	pagesize: number;
	order: string;
	orderBy: string;
}

// A consortium-sized total: with the fixture's four, MUI rightly pulls a linked page 2 back to 1
const dashboard = {
	allRequests: { ...patronRequests.patronRequests, totalSize: 2000 },
	activeRequests: { totalSize: 1 },
	exceptionRequests: { totalSize: 1 },
	outOfSequenceRequests: { totalSize: 0 },
	finishedRequests: { totalSize: 0 },
};

/** Mocks the page, and records every grid request it makes. */
const openable = async (page: Page) => {
	const asked: DashboardVariables[] = [];
	await seedAuth(page);
	await mockGraphQL(page, {
		LoadConsortium: consortiumBasics,
		LoadConsortiumHeader: consortiumBasics,
		LoadLibraries: libraries,
		LoadLocationForPRGrid: locations,
		LoadPatronRequests: patronRequests,
		LoadPatronRequestTotals: patronRequests,
		GetPatronRequestDashboard: (variables: DashboardVariables) => {
			asked.push(variables);
			return dashboard;
		},
	});
	return asked;
};

const lastAsked = async (asked: DashboardVariables[]) => {
	await expect.poll(() => asked.length).toBeGreaterThan(0);
	return asked[asked.length - 1];
};

const search = (page: Page) => decodeURIComponent(new URL(page.url()).search);

const gridShown = (page: Page) =>
	expect(page.getByText("Alpha and the art of failure").first()).toBeVisible();

const barcodeHeader = (page: Page) =>
	page.getByRole("columnheader", { name: "Patron barcode", exact: true });

const hideBarcodeColumn = async (page: Page) => {
	await page.getByRole("button", { name: "Find column" }).click();
	await page
		.getByRole("checkbox", { name: "Patron barcode", exact: true })
		.uncheck();
	await page.keyboard.press("Escape");
	await expect(barcodeHeader(page)).toHaveCount(0);
};

const notice = (page: Page) => page.getByText("Showing your last view");

test.describe("A grid's view in its URL", () => {
	test("a link opens the same view in a browser that has never seen it", async ({
		page,
		browser,
	}) => {
		const asked = await openable(page);
		await page.goto("/patronRequests/all");
		await gridShown(page);
		await hideBarcodeColumn(page);
		await page
			.getByRole("columnheader", { name: "Description", exact: false })
			.or(page.getByRole("columnheader", { name: "Request created" }))
			.first()
			.click();
		await expect.poll(() => search(page)).toContain("sort=");
		const link = page.url();
		const original = await lastAsked(asked);
		expect(search(page)).toContain("hide=patronBarcode");

		const baseURL = test.info().project.use.baseURL;
		const fresh = await browser.newContext({ baseURL });
		try {
			const other = await fresh.newPage();
			const otherAsked = await openable(other);
			await other.goto(link);
			await gridShown(other);
			await expect(barcodeHeader(other)).toHaveCount(0);
			const opened = await lastAsked(otherAsked);
			expect(opened.order).toBe(original.order);
			expect(opened.orderBy).toBe(original.orderBy);
			expect(opened.allQuery).toBe(original.allQuery);
			await expect(notice(other)).toHaveCount(0);
		} finally {
			await fresh.close();
		}
	});

	test("a link's filters, sort, page and page size are what the server is asked for", async ({
		page,
	}) => {
		const asked = await openable(page);
		await page.goto(
			"/patronRequests/all?filters=status:ERROR,SUBMITTED_TO_DCB&sort=dateCreated:asc&page=2&pageSize=50",
		);
		await gridShown(page);
		const sent = await lastAsked(asked);
		expect(sent.allQuery).toContain("status:ERROR OR status:SUBMITTED_TO_DCB");
		expect(sent.order).toBe("dateCreated");
		expect(sent.orderBy).toBe("ASC");
		expect(sent.pageno).toBe(1);
		expect(sent.pagesize).toBe(50);
		// Not pulled back to the first page while the rows were loading
		await expect(page.getByText(/51.100 of 2,?000/)).toBeVisible();
		expect(search(page)).toContain("page=2");
		expect((await lastAsked(asked)).pageno).toBe(1);
	});

	test("a barcode filter filters the grid and never reaches the address", async ({
		page,
	}) => {
		const asked = await openable(page);
		const addresses: string[] = [];
		page.on("framenavigated", (frame) => {
			if (frame === page.mainFrame()) addresses.push(frame.url());
		});
		await page.goto("/patronRequests/all");
		await gridShown(page);

		await page.getByRole("button", { name: "Show filters" }).click();
		await page
			.locator(".MuiDataGrid-filterFormColumnInput .MuiSelect-select")
			.click();
		await page
			.getByRole("option", { name: "Patron barcode", exact: true })
			.click();
		await page
			.locator(".MuiDataGrid-filterFormValueInput input")
			.fill("2100012345");

		await expect
			.poll(async () => (await lastAsked(asked)).allQuery)
			.toContain("patronBarcode:2100012345");
		await page.keyboard.press("Escape");
		expect(page.url()).not.toContain("2100012345");
		expect(await page.evaluate(() => location.href)).not.toContain(
			"2100012345",
		);

		// The tab's own history entry holds it: a reload of this tab still filters
		await page.reload();
		await gridShown(page);
		await expect
			.poll(async () => (await lastAsked(asked)).allQuery)
			.toContain("patronBarcode:2100012345");
		await expect(
			page.getByText("Some filters are not included in a copied link"),
		).toBeVisible();

		const stored = await page.evaluate(() => JSON.stringify(sessionStorage));
		expect(stored).not.toContain("2100012345");
		for (const address of addresses)
			expect(address).not.toContain("2100012345");
	});

	test("Rule 2: a bare address opens the last view, says so, and Reset returns the defaults", async ({
		page,
	}) => {
		const asked = await openable(page);
		await page.goto("/patronRequests/all");
		await gridShown(page);
		await expect(notice(page)).toHaveCount(0);
		await hideBarcodeColumn(page);
		await expect.poll(() => search(page)).toBe("?hide=patronBarcode");

		await page.goto("/patronRequests/all");
		await expect.poll(() => search(page)).toBe("?hide=patronBarcode");
		await expect(notice(page)).toBeVisible();
		await expect(
			page.getByRole("status").filter({ has: notice(page) }),
		).toHaveCount(1);
		await gridShown(page);
		await expect(barcodeHeader(page)).toHaveCount(0);

		await page.getByRole("button", { name: "Reset to default" }).click();
		await expect.poll(() => search(page)).toBe("");
		await expect(notice(page)).toHaveCount(0);
		await expect(barcodeHeader(page)).toBeVisible();

		// Forgotten, not merely hidden: a bare address is the defaults again
		await page.goto("/patronRequests/all");
		await gridShown(page);
		expect(search(page)).toBe("");
		await expect(notice(page)).toHaveCount(0);
		expect((await lastAsked(asked)).orderBy).toBe("DESC");
	});

	test("Rule 1: a link's view is shown, and does not replace the last view", async ({
		page,
	}) => {
		await openable(page);
		await page.goto("/patronRequests/all");
		await gridShown(page);
		await hideBarcodeColumn(page);

		await page.goto("/patronRequests/all?sort=dateCreated:asc&page=2");
		await gridShown(page);
		await expect(barcodeHeader(page)).toBeVisible();
		await expect(notice(page)).toHaveCount(0);
		expect(search(page)).toBe("?sort=dateCreated:asc&page=2");

		await page.goto("/patronRequests/all");
		await expect.poll(() => search(page)).toBe("?hide=patronBarcode");
		await expect(notice(page)).toBeVisible();
	});

	test("a drill-down's link is a link: nothing is restored over it", async ({
		page,
	}) => {
		const asked = await openable(page);
		await page.goto("/patronRequests/all");
		await gridShown(page);
		await hideBarcodeColumn(page);

		await page.goto("/patronRequests/all?q=status:ERROR");
		await gridShown(page);
		expect(search(page)).toBe("?q=status:ERROR");
		await expect(barcodeHeader(page)).toBeVisible();
		expect((await lastAsked(asked)).allQuery).toContain("status:ERROR");
	});

	test("a hand-edited link opens with its valid part", async ({ page }) => {
		const asked = await openable(page);
		await page.goto(
			"/patronRequests/all?filters=secret:x&filters=description:contains:Alpha" +
				"&filters=elapsedTimeInCurrentStatus:over:soon&sort=sideways&page=-4&pageSize=7&hide=__check__,ghost",
		);
		await gridShown(page);
		const sent = await lastAsked(asked);
		expect(sent.allQuery).toContain("description:*Alpha*");
		expect(sent.allQuery).not.toContain("secret");
		expect(sent.allQuery).not.toContain("elapsedTimeInCurrentStatus");
		expect(sent.order).toBe("dateCreated");
		expect(sent.orderBy).toBe("DESC");
		expect(sent.pageno).toBe(0);
		expect(sent.pagesize).toBe(20);
	});

	test("a link in the old JSON form opens the defaults rather than an error", async ({
		page,
	}) => {
		await openable(page);
		await page.goto(
			"/patronRequests/all?filters=%7B%22items%22%3A%5B%5D%7D&sort=%5B%5D",
		);
		await gridShown(page);
	});
});

test.describe("Every patron request tab", () => {
	for (const tab of ["exception", "outOfSequence", "active", "completed"]) {
		test(`/patronRequests/${tab} reads its view from the URL and remembers its own`, async ({
			page,
		}) => {
			const asked = await openable(page);
			await page.goto(
				`/patronRequests/${tab}?sort=dateCreated:asc&pageSize=50`,
			);
			await gridShown(page);
			const sent = await lastAsked(asked);
			expect(sent.orderBy).toBe("ASC");
			expect(sent.pagesize).toBe(50);

			// The reader's own change makes the view they are looking at the last one
			await hideBarcodeColumn(page);
			await page.goto(`/patronRequests/${tab}`);
			await expect
				.poll(() => search(page))
				.toBe("?sort=dateCreated:asc&pageSize=50&hide=patronBarcode");
			await expect(notice(page)).toBeVisible();

			// Each tab remembers its own view, not its neighbours'
			await page.goto("/patronRequests/all");
			await gridShown(page);
			expect(search(page)).toBe("");
		});
	}
});

test.describe("The audit explorer", () => {
	test("keeps its description search in the address, beside the grid's own filters", async ({
		page,
	}) => {
		const audits: { query: string }[] = [];
		const incidence: { query: string }[] = [];
		await seedAuth(page);
		await useAllFeatures(page);
		await mockGraphQL(page, {
			LoadConsortiumHeader: consortiumBasics,
			LoadAudits: (variables: { query: string }) => {
				audits.push(variables);
				return { audits: { totalSize: 0, content: [] } };
			},
			LoadAuditIncidence: (variables: { query: string }) => {
				incidence.push(variables);
				return {
					auditIncidence: { interval: "day", totalSize: 0, buckets: [] },
				};
			},
		});

		await page.goto("/serviceInfo/auditExplorer");
		await page
			.getByRole("textbox", { name: "Search brief descriptions" })
			.fill("Read timeout");
		await expect.poll(() => search(page)).toBe("?search=Read+timeout");
		await expect
			.poll(() => audits.at(-1)?.query ?? "")
			.toContain("briefDescription:*Read?timeout*");
		await expect
			.poll(() => incidence.at(-1)?.query ?? "")
			.toContain("briefDescription:*Read?timeout*");

		// A shared link opens the same search, in the box as well as the grid
		await page.reload();
		await expect(
			page.getByRole("textbox", { name: "Search brief descriptions" }),
		).toHaveValue("Read timeout");
		expect(search(page)).not.toContain("filters=");
	});
});

test.describe("A library's grids", () => {
	const LIBRARY_A = "c23df3ab-77c0-5689-b56d-fc8a2d6a5f22";
	const LIBRARY_B = "7d9f0e21-4b3a-4c5d-9e8f-0a1b2c3d4e5f";
	const requests = (library: string) =>
		`/libraries/${library}/patronRequests/all`;

	test("each remember their own view", async ({ page }) => {
		await seedAuth(page);
		await mockGraphQL(page, MOCKS);

		await page.goto(requests(LIBRARY_A));
		await gridShown(page);
		await hideBarcodeColumn(page);
		await expect.poll(() => search(page)).toBe("?hide=patronBarcode");

		// Another library's grid is untouched by it
		await page.goto(requests(LIBRARY_B));
		await gridShown(page);
		expect(search(page)).toBe("");
		await expect(barcodeHeader(page)).toBeVisible();

		await page.goto(requests(LIBRARY_A));
		await expect.poll(() => search(page)).toBe("?hide=patronBarcode");
		await expect(notice(page)).toBeVisible();
	});
});

test.describe("A page with two grids", () => {
	const LIBRARY = "c23df3ab-77c0-5689-b56d-fc8a2d6a5f22";
	const page_ = `/libraries/${LIBRARY}/referenceValueMappings/patronType`;
	// The fixture library, given a second Host LMS so its mappings page shows a second grid
	const withSecondHostLms = {
		libraries: {
			...libraryDetail.libraries,
			content: [
				{
					...libraryDetail.libraries.content[0],
					secondHostLms: {
						id: "5ec0d000-0000-4000-8000-000000000002",
						code: "BETA-HOST",
						name: "Beta",
						clientConfig: {},
					},
				},
			],
		},
	};

	test("keeps the second grid's view under its own namespace", async ({
		page,
	}) => {
		await seedAuth(page);
		await mockGraphQL(page, { ...MOCKS, LoadLibrary: withSecondHostLms });
		await page.goto(page_);
		const findColumn = page.getByRole("button", { name: "Find column" });
		await expect(findColumn).toHaveCount(2);

		// Hide a column in the second grid only
		await findColumn.nth(1).click();
		await page
			.getByRole("checkbox", { name: "From value", exact: true })
			.uncheck();
		await page.keyboard.press("Escape");
		await expect.poll(() => search(page)).toBe("?secondary.hide=fromValue");
		const fromValue = page.getByRole("columnheader", {
			name: "From value",
			exact: true,
		});
		await expect(fromValue).toHaveCount(1);

		// Both are restored on a bare address, each to its own view
		await page.goto(page_);
		await expect.poll(() => search(page)).toBe("?secondary.hide=fromValue");
		await expect(fromValue).toHaveCount(1);
		await expect(notice(page)).toHaveCount(1);
	});
});

test.describe("The search pager", () => {
	test("reads a one-based page beside the query, and never restores a search", async ({
		page,
	}) => {
		const offsets: string[] = [];
		await useAllFeatures(page);
		await mockGraphQL(page, MOCKS);
		await seedAuth(page);
		await page.route("**/search/instances*", (route) => {
			offsets.push(
				new URL(route.request().url()).searchParams.get("offset") ?? "",
			);
			return route.fulfill({
				json: {
					totalRecords: 100,
					instances: [
						{
							id: "4f8c1b2e-9a3d-4c7f-8e15-2b6d7a0c9e31",
							title: "Local history",
						},
					],
				},
			});
		});

		await page.goto("/search?q=history&page=2");
		await expect(page.getByText("Local history")).toBeVisible();
		expect(offsets.at(-1)).toBe("25");

		// A bare search page is a new search: nothing is restored onto it
		await page.goto("/search");
		await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
		expect(search(page)).toBe("");
	});
});

const openColumnMenu = async (page: Page, column: string) => {
	// A header's accessible name carries its menu button's, which shows on hover
	const header = page
		.getByRole("columnheader")
		.filter({ hasText: column })
		.first();
	await header.hover();
	await header.getByRole("button", { name: `${column} column menu` }).click();
	const menu = page.getByRole("menu");
	await expect(menu).toBeVisible();
	return menu;
};

const headerNames = async (page: Page) =>
	(await page.getByRole("columnheader").allInnerTexts())
		.map((text) => text.trim())
		.filter(Boolean);

test.describe("A grid's columns in its URL", () => {
	test("a pinned column is pinned in the link, and pinned where it is opened", async ({
		page,
		browser,
	}) => {
		await openable(page);
		await page.goto("/patronRequests/all");
		await gridShown(page);
		const [, column] = await headerNames(page);

		const menu = await openColumnMenu(page, column);
		await menu.getByRole("menuitem", { name: "Pin to left" }).click();
		await expect.poll(() => search(page)).toMatch(/^\?pinLeft=\w+$/);
		const field = search(page).slice("?pinLeft=".length);

		const baseURL = test.info().project.use.baseURL;
		const fresh = await browser.newContext({ baseURL });
		try {
			const other = await fresh.newPage();
			await openable(other);
			await other.goto(page.url());
			await gridShown(other);
			await expect(
				other.locator(`[role="columnheader"][data-field="${field}"]`),
			).toHaveClass(/pinnedLeft/);
		} finally {
			await fresh.close();
		}
	});

	test("a column moves from the keyboard, and stays moved across a reload", async ({
		page,
	}) => {
		await openable(page);
		await page.goto("/patronRequests/all");
		await gridShown(page);
		const before = await headerNames(page);
		const column = before[2];

		const menu = await openColumnMenu(page, column);
		const moveLeft = menu.getByRole("menuitem", { name: "Move left" });
		await moveLeft.focus();
		await page.keyboard.press("Enter");

		await expect.poll(() => search(page)).toMatch(/^\?order=/);
		const after = await headerNames(page);
		expect(after.indexOf(column)).toBe(1);
		expect(after[2]).toBe(before[1]);

		await page.reload();
		await gridShown(page);
		await expect.poll(() => headerNames(page)).toEqual(after);
	});
});
