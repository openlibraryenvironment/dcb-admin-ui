import { test, expect } from "@playwright/test";

import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { enableInsights, mockInsights } from "./fixtures/insights-mocks";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import libraries from "./fixtures-data/libraries.json";
import patronRequests from "./fixtures-data/patron-requests.json";

/**
 * From a figure to the requests behind it, and back.
 *
 * What matters is not that a link exists but that the QUERY reaching the server is the one
 * the figure counted: a drill-down that lands on a differently-filtered grid is worse than
 * none, because the reader has no way to tell.
 */

const MOCKS = {
	LoadConsortiumHeader: consortiumBasics,
	LoadLibraries: libraries,
	LoadPatronRequests: patronRequests,
	GetPatronRequestDashboard: patronRequests,
};

/** Every GraphQL query string the page sends, so the composed filter can be read off it. */
function trackQueries(page: import("@playwright/test").Page) {
	const seen: string[] = [];

	page.on("request", (request) => {
		if (!request.url().includes("/graphql")) return;
		const body = request.postDataJSON();
		if (typeof body?.variables?.query === "string") {
			seen.push(body.variables.query);
		}
		if (typeof body?.variables?.allQuery === "string") {
			seen.push(body.variables.allQuery);
		}
	});

	return seen;
}

test.describe("Insights drill-down", () => {
	test.beforeEach(async ({ page }) => {
		await enableInsights(page);
		await seedAuth(page);
		await mockInsights(page);
		await mockGraphQL(page, MOCKS);
	});

	test("a failure reason leads to the requests that failed that way", async ({
		page,
	}) => {
		await page.goto("/consortium/insights?tab=service");

		const link = page.getByRole("link", {
			name: "Open the requests behind NO_ITEMS_SELECTABLE_AT_ANY_AGENCY",
		});

		for (let i = 0; i < 12 && !(await link.isVisible()); i++) {
			await page.mouse.wheel(0, 1200);
			await expect(page.locator("body")).toBeVisible();
		}

		const queries = trackQueries(page);
		await link.click();

		await expect(page).toHaveURL(/\/patronRequests\/exception/);

		// The tab's own preset AND the panel's filter - the reason the reader clicked,
		// not merely "everything that errored".
		await expect
			.poll(() => queries.join(" | "))
			.toContain('previousStatus:"NO_ITEMS_SELECTABLE_AT_ANY_AGENCY"');
		await expect.poll(() => queries.join(" | ")).toContain('status: "ERROR"');
	});

	test("the destination says where the reader came from, and goes back there", async ({
		page,
	}) => {
		await page.goto("/consortium/insights?tab=service&range=90d");

		const link = page.getByRole("link", {
			name: "Open the requests behind NO_ITEMS_SELECTABLE_AT_ANY_AGENCY",
		});

		for (let i = 0; i < 12 && !(await link.isVisible()); i++) {
			await page.mouse.wheel(0, 1200);
			await expect(page.locator("body")).toBeVisible();
		}

		await link.click();

		// Named for the panel, not "Back": the reader came from one figure among thirty.
		const back = page.getByRole("link", {
			name: "Back to insights: Why requests fail",
		});
		await expect(back).toBeVisible();

		await back.click();

		// The exact view they left, subject and window included.
		await expect(page).toHaveURL(/tab=service/);
		await expect(page).toHaveURL(/range=90d/);
	});

	test("the error rate headline leads to everything that failed", async ({
		page,
	}) => {
		await page.goto("/consortium/insights");

		const link = page.getByRole("link", {
			name: "Open the requests behind Error rate",
			exact: true,
		});
		await expect(link).toBeVisible();

		// The trend tile beside it counts the same measure over time, so its link has to
		// be distinguishable by NAME - which is all a reader listing the page's links gets.
		await expect(
			page.getByRole("link", {
				name: "Open the requests behind Error rate over time",
			}),
		).toBeVisible();

		await link.click();
		await expect(page).toHaveURL(/\/patronRequests\/exception/);
		await expect(page).toHaveURL(/dateCreated/);
	});

	test("a hand-edited return link that leaves the application is ignored", async ({
		page,
	}) => {
		// The back link is rendered as an href, so a parameter that can name any origin is
		// an open redirect. Being only a back button today is not an argument.
		await page.goto(
			"/patronRequests/exception?from=https%3A%2F%2Fevil.example%2Fphish&fromLabel=Why%20requests%20fail",
		);

		await expect(
			page.getByRole("link", { name: /Back to insights/ }),
		).toHaveCount(0);
	});
});
