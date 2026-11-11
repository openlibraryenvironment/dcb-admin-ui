import { type Page } from "@playwright/test";
import { test, expect } from "./fixtures/test";

import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import { scanForViolations, waitForDialogToSettle } from "./fixtures/axe";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import libraries from "./fixtures-data/libraries.json";
import {
	patronRequestDetailMocks,
	TRACKED_REQUEST,
} from "./fixtures/patron-request-detail";

const SUPPLIER = {
	id: "5a5a5a5a-1111-5111-9111-111111111111",
	localAgency: "beta",
	hostLmsCode: "beta-lms",
	isActive: true,
	localHoldCount: 4,
	localRenewable: false,
	localHoldingId: "SUP-HOLDING-9",
};

const REQUEST = {
	...TRACKED_REQUEST,
	autoPollCountForCurrentStatus: 17,
	manualPollCountForCurrentStatus: 3,
	localHoldingId: "BOR-HOLDING-2",
	pickupItemBarcode: "PICKUP-BC-77",
	pickupHoldingId: "PICKUP-HOLDING-5",
	suppliers: [SUPPLIER],
};

// TRACKED_REQUEST is in PICKUP_TRANSIT: the item has shipped, so no supplier fix-up applies
const AT_SUPPLIER = {
	...REQUEST,
	status: "REQUEST_PLACED_AT_SUPPLYING_AGENCY",
};

const requestIs = (request: Record<string, unknown>) => ({
	LoadPatronRequest: { patronRequests: { totalSize: 1, content: [request] } },
});

const mockRequest = (page: Page, extra: Record<string, unknown> = {}) =>
	mockGraphQL(page, {
		LoadConsortium: consortiumBasics,
		LoadConsortiumHeader: consortiumBasics,
		LoadHostLms: { hostLms: { totalSize: 0, content: [] } },
		LoadLibraryDirectory: libraries,
		...patronRequestDetailMocks,
		LoadPatronRequest: { patronRequests: { totalSize: 1, content: [REQUEST] } },
		...extra,
	});

/** The value shown under an attribute title on the open tab. */
const attribute = (page: Page, title: string) =>
	page
		.getByRole("tabpanel")
		.getByText(title, { exact: true })
		.locator("xpath=..");

test.describe("patron request tracking and holding details", () => {
	test.beforeEach(async ({ page }) => {
		await seedAuth(page, { roles: ["CONSORTIUM_ADMIN"] });
		await useAllFeatures(page);
		await mockRequest(page);
		await page.goto(`/patronRequests/${REQUEST.id}`);
	});

	test("splits the status checks into automatic and manual", async ({
		page,
	}) => {
		await expect(attribute(page, "Automatic checks in status")).toContainText(
			"17",
		);
		await expect(attribute(page, "Manual checks in status")).toContainText("3");
	});

	test("shows the supplier's hold queue, renewability and holding", async ({
		page,
	}) => {
		await page.getByRole("tab", { name: "Supplying" }).click();

		await expect(attribute(page, "Holds queued at supplier")).toContainText(
			"4",
		);
		await expect(attribute(page, "Renewable at supplier")).toContainText(
			"false",
		);
		await expect(attribute(page, "Supplier holding ID")).toContainText(
			"SUP-HOLDING-9",
		);
	});

	test("shows the borrowing and pickup identifiers", async ({ page }) => {
		await page.getByRole("tab", { name: "Borrowing" }).click();
		await expect(attribute(page, "Borrower holding ID")).toContainText(
			"BOR-HOLDING-2",
		);

		await page.getByRole("tab", { name: "Pickup" }).click();
		await expect(attribute(page, "Pickup item barcode")).toContainText(
			"PICKUP-BC-77",
		);
		await expect(attribute(page, "Pickup holding ID")).toContainText(
			"PICKUP-HOLDING-5",
		);
	});
});

const PREVIOUS = {
	inactiveSupplierRequests: {
		totalSize: 1,
		content: [
			{
				id: "6b6b6b6b-1111-5111-9111-111111111111",
				dateCreated: "2026-10-30T09:15:00Z",
				localAgency: "gamma",
				hostLmsCode: "gamma-lms",
				localItemId: "i-445",
				localItemBarcode: "GAMMA-BC-1",
				localItemLocationCode: "MAIN",
				localItemType: "BOOK",
				canonicalItemType: "CIRC",
				localBibId: "b-12",
			},
		],
	},
};

const settings = (reResolution: boolean) => ({
	consortia: {
		totalSize: 1,
		content: [
			{
				id: "c1",
				name: "e2e",
				displayName: "E2E",
				functionalSettings: [
					{ id: "fs1", name: "RE_RESOLUTION", enabled: reResolution },
				],
			},
		],
	},
});

const open = async (
	page: Page,
	roles: string[],
	extra: Record<string, unknown> = {},
	path = `/patronRequests/${REQUEST.id}`,
) => {
	await seedAuth(page, { roles });
	await mockRequest(page, extra);
	await page.goto(path);
	await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
};

test.describe("previous suppliers", () => {
	test.beforeEach(async ({ page }) => {
		await useAllFeatures(page);
	});

	test("lists them for an ADMIN, asking only for this request's", async ({
		page,
	}) => {
		let query = "";
		await open(page, ["ADMIN", "CONSORTIUM_ADMIN"], {
			LoadInactiveSupplierRequests: (variables: { query: string }) => {
				query = variables.query;
				return PREVIOUS;
			},
		});

		await page.getByRole("tab", { name: "Previous suppliers" }).click();

		const table = page.getByRole("table", { name: "Previous suppliers" });
		await expect(
			table.getByRole("columnheader", { name: "Moved off" }),
		).toBeVisible();
		await expect(table.getByRole("cell", { name: "GAMMA-BC-1" })).toBeVisible();
		expect(query).toBe(`patronRequest:"${REQUEST.id}"`);
	});

	test("is not offered without ADMIN, even from a shared link", async ({
		page,
	}) => {
		await open(
			page,
			["CONSORTIUM_ADMIN"],
			{},
			`/patronRequests/${REQUEST.id}?tab=previousSuppliers`,
		);

		await expect(page.getByRole("tab", { name: "General" })).toHaveAttribute(
			"aria-selected",
			"true",
		);
		await expect(
			page.getByRole("tab", { name: "Previous suppliers" }),
		).toHaveCount(0);
	});
});

test.describe("supplier fix-ups", () => {
	test.beforeEach(async ({ page }) => {
		await useAllFeatures(page);
	});

	const menuItem = async (page: Page, name: string) => {
		await page.getByRole("button", { name: "Actions" }).click();
		return page.getByRole("menuitem", { name });
	};

	for (const roles of [["CONSORTIUM_ADMIN"], ["ADMIN"]]) {
		test(`are not offered to ${roles.join(" ")} alone`, async ({ page }) => {
			await open(page, roles, requestIs(AT_SUPPLIER));
			await page.getByRole("button", { name: "Actions" }).click();

			await expect(
				page.getByRole("menuitem", { name: "Skip supplier" }),
			).toHaveCount(0);
		});
	}

	test("are not offered once the item has left the supplier", async ({
		page,
	}) => {
		await open(page, ["ADMIN", "CONSORTIUM_ADMIN"], requestIs(REQUEST));
		await page.getByRole("button", { name: "Actions" }).click();

		await expect(
			page.getByRole("menuitem", { name: "Skip supplier" }),
		).toHaveCount(0);
		await expect(
			page.getByRole("menuitem", { name: "Cancel supplier hold" }),
		).toHaveCount(0);
	});

	test("skip warns that the request will be cancelled when re-resolution is off, then skips", async ({
		page,
	}) => {
		const posts: string[] = [];
		await page.route("**/suppliers/requests/**", async (route) => {
			posts.push(new URL(route.request().url()).pathname);
			await route.fulfill({ json: { message: "re-resolution triggered" } });
		});
		await open(page, ["ADMIN", "CONSORTIUM_ADMIN"], {
			...requestIs(AT_SUPPLIER),
			LoadConsortiumFS: settings(false),
		});

		await (await menuItem(page, "Skip supplier")).click();
		const dialog = page.getByRole("dialog", { name: "Skip this supplier?" });
		await expect(dialog).toContainText(
			"Re-resolution is off for this consortium, so the whole request will be cancelled.",
		);
		await dialog.getByRole("button", { name: "Skip supplier" }).click();

		await expect(dialog.getByRole("status")).toContainText(
			"DCB cancelled the hold at beta",
		);
		expect(posts).toHaveLength(1);
		expect(posts[0]).toMatch(
			new RegExp(`/suppliers/requests/${SUPPLIER.id}/skip$`),
		);
	});

	test("the dialog cannot be dismissed while the skip is running, and focuses Close after", async ({
		page,
	}) => {
		let release = () => {};
		const held = new Promise<void>((resolve) => (release = resolve));
		const posts: string[] = [];
		await page.route("**/suppliers/requests/**", async (route) => {
			posts.push(route.request().url());
			await held;
			await route.fulfill({ json: { message: "re-resolution triggered" } });
		});
		await open(page, ["ADMIN", "CONSORTIUM_ADMIN"], {
			...requestIs(AT_SUPPLIER),
			LoadConsortiumFS: settings(true),
		});

		await (await menuItem(page, "Skip supplier")).click();
		const dialog = page.getByRole("dialog", { name: "Skip this supplier?" });
		await dialog.getByRole("button", { name: "Skip supplier" }).click();
		await expect.poll(() => posts.length).toBe(1);
		await page.keyboard.press("Escape");

		await expect(dialog).toBeVisible();
		release();
		await expect(dialog.getByRole("status")).toContainText(
			"DCB cancelled the hold at beta",
		);
		await expect(dialog.getByRole("button", { name: "Close" })).toBeFocused();
		expect(posts).toHaveLength(1);
	});

	test("the outcome names the supplier the dialog was opened for", async ({
		page,
	}) => {
		let skipped = false;
		await page.route("**/suppliers/requests/**", async (route) => {
			skipped = true;
			await route.fulfill({ json: { message: "re-resolution triggered" } });
		});
		await open(page, ["ADMIN", "CONSORTIUM_ADMIN"], {
			LoadConsortiumFS: settings(true),
			// Re-resolution has moved the request on to gamma by the time it is refetched
			LoadPatronRequest: () =>
				requestIs(
					skipped
						? {
								...AT_SUPPLIER,
								suppliers: [
									{
										...SUPPLIER,
										id: "6b6b6b6b-2222-5222-9222-222222222222",
										localAgency: "gamma",
									},
								],
							}
						: AT_SUPPLIER,
				).LoadPatronRequest,
		});

		await (await menuItem(page, "Skip supplier")).click();
		const dialog = page.getByRole("dialog", { name: "Skip this supplier?" });
		await dialog.getByRole("button", { name: "Skip supplier" }).click();

		await expect(dialog.getByRole("status")).toContainText(
			"DCB cancelled the hold at beta",
		);
	});

	test("cancel says when the supplier did not confirm, and nothing was paused", async ({
		page,
	}) => {
		await page.route("**/suppliers/requests/*/cancel", (route) =>
			route.fulfill({ json: { paused: false, supplierStatus: "PLACED" } }),
		);
		await open(page, ["ADMIN", "CONSORTIUM_ADMIN"], requestIs(AT_SUPPLIER));

		await (await menuItem(page, "Cancel supplier hold")).click();
		const dialog = page.getByRole("dialog");
		await dialog.getByRole("button", { name: "Cancel supplier hold" }).click();

		await expect(dialog.getByRole("status")).toContainText(
			"beta reports the hold as PLACED, not cancelled, so the supplier was not paused.",
		);
	});

	test("reactivate is offered for a paused supplier and sends active: true", async ({
		page,
	}) => {
		let body: unknown;
		await page.route("**/suppliers/requests/*/active", async (route) => {
			body = route.request().postDataJSON();
			await route.fulfill({ json: { activeNow: true } });
		});
		await open(
			page,
			["ADMIN", "CONSORTIUM_ADMIN"],
			requestIs({ ...REQUEST, suppliers: [{ ...SUPPLIER, isActive: false }] }),
		);

		await page.getByRole("button", { name: "Actions" }).click();
		await expect(
			page.getByRole("menuitem", { name: "Skip supplier" }),
		).toHaveCount(0);
		await page.getByRole("menuitem", { name: "Reactivate supplier" }).click();
		const dialog = page.getByRole("dialog");
		await dialog.getByRole("button", { name: "Reactivate supplier" }).click();

		await expect(dialog.getByRole("status")).toContainText(
			"The supplier is active again.",
		);
		expect(body).toEqual({ active: true });
	});

	for (const scheme of ["light", "dark"] as const) {
		test(`the skip dialog passes axe, ${scheme}`, async ({ page }) => {
			await page.emulateMedia({ colorScheme: scheme });
			await open(page, ["ADMIN", "CONSORTIUM_ADMIN"], {
				...requestIs(AT_SUPPLIER),
				LoadConsortiumFS: settings(true),
			});
			await (await menuItem(page, "Skip supplier")).click();
			const dialog = page.getByRole("dialog", { name: "Skip this supplier?" });
			await expect(dialog).toContainText("DCB will look for another supplier");
			await waitForDialogToSettle(page);

			await scanForViolations(page);
		});
	}
});
