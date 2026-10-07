import { test, expect, type Page } from "@playwright/test";

import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import consortiumBasics from "./fixtures-data/consortium-basics.json";

/**
 * Both Request Errors grids are fed `/sql` results, and GenericSelectService returns
 * whatever columns the named query selects. None of the 56 selects an `id`, so MUI X
 * threw and the route rendered the generic error page instead of the grid - for any
 * consortium with any matching error. docs/sql-backed-grids.md.
 *
 * The fixtures below are the real column sets: errorOverview.sql's five, and the
 * drill-down's six.
 */

const OVERVIEW_HITS = [
	{
		description: "Read timeout, DCB-1450",
		namedSql: "errors/readTimeout",
		total: "12",
		mostRecent: "2026-09-30",
		earliest: "2026-08-01",
	},
	{
		description: "Already on hold, DCB-1452",
		namedSql: "errors/alreadyOnHold",
		total: "3",
		mostRecent: "2026-09-28",
		earliest: "2026-09-02",
	},
];

const DRILLDOWN_HITS = [
	{
		Date: "2026-09-30",
		Requester: "Alpha Test Library",
		Supplier: "Beta Test Library",
		RequestId: "11111111-1111-1111-1111-111111111111",
		RequestURL: "https://example.invalid/request",
		URL: "https://example.invalid/audit",
	},
];

const mockSql = async (page: Page, hits: unknown[]) => {
	await page.route("**/sql?*", (route) => route.fulfill({ json: { hits } }));
};

test.beforeEach(async ({ page }) => {
	await seedAuth(page);
	await useAllFeatures(page);
	await mockGraphQL(page, { LoadConsortiumHeader: consortiumBasics });
});

test("the error overview renders its rows, not the error page", async ({
	page,
}) => {
	await mockSql(page, OVERVIEW_HITS);
	await page.goto("/serviceInfo/requestErrors");

	await expect(page.getByText("Read timeout, DCB-1450")).toBeVisible();
	await expect(page.getByText("Already on hold, DCB-1452")).toBeVisible();

	// The symptom was the global error boundary, so assert it is NOT what rendered.
	await expect(page.getByRole("grid")).toBeVisible();
});

test("two rows with the same counts are still two rows", async ({ page }) => {
	// A duplicate id silently collapses rows rather than throwing, so identical
	// values must not produce the same key.
	await mockSql(page, [
		{ description: "First", namedSql: "errors/a", total: "1" },
		{ description: "Second", namedSql: "errors/b", total: "1" },
	]);
	await page.goto("/serviceInfo/requestErrors");

	await expect(page.getByText("First")).toBeVisible();
	await expect(page.getByText("Second")).toBeVisible();
});

test("the drill-down renders its rows, not the error page", async ({
	page,
}) => {
	await mockSql(page, DRILLDOWN_HITS);
	await page.goto(
		"/serviceInfo/requestErrors/requests?namedSql=errors%2FreadTimeout&description=Read+timeout",
	);

	await expect(page.getByText("Alpha Test Library")).toBeVisible();
	await expect(page.getByRole("grid")).toBeVisible();
});

test("an empty result is an empty grid, not a crash", async ({ page }) => {
	await mockSql(page, []);
	await page.goto("/serviceInfo/requestErrors");

	await expect(page.getByRole("grid")).toBeVisible();
});
