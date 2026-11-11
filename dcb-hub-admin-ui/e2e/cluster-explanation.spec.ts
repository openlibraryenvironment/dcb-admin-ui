import { test, expect } from "./fixtures/test";
import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import { CLUSTER_ID, mockClusterRest } from "./fixtures/cluster-mocks";
import { MOCKS } from "./fixtures/routes";

// From e2e/fixtures-data/cluster-audit-log.json: a match, a merge and a new-cluster event.
const SUBJECT_BIB = "bb220000-2222-5222-9222-bbbbbbbbbbbb";
const MATCHED_BIB = "99aa0000-9999-5999-9999-aaaaaaaaaaaa";
const MATCH_EVENT = "ff660000-6666-5666-9666-ffffffffffff";

test.beforeEach(async ({ page }) => {
	await useAllFeatures(page);
	await mockGraphQL(page, MOCKS);
	await mockClusterRest(page);
	await seedAuth(page);
});

test("a match event links to the incoming bib and to the bib it matched, not to the event", async ({
	page,
}) => {
	await page.goto(`/search/${CLUSTER_ID}/clusterExplanation`);

	await page
		.getByRole("row")
		.filter({ hasText: "Match: shared identifier" })
		.getByRole("button", { name: "Expand", exact: true })
		.click();

	await expect(page.getByRole("link", { name: SUBJECT_BIB })).toHaveAttribute(
		"href",
		new RegExp(`/bibs/${SUBJECT_BIB}$`),
	);
	await expect(page.getByRole("link", { name: MATCHED_BIB })).toHaveAttribute(
		"href",
		new RegExp(`/bibs/${MATCHED_BIB}$`),
	);
	await expect(page.locator(`a[href$="/bibs/${MATCH_EVENT}"]`)).toHaveCount(0);
});

test("an event that matched no bib offers no matched-against link", async ({
	page,
}) => {
	await page.goto(`/search/${CLUSTER_ID}/clusterExplanation`);

	await page
		.getByRole("row")
		.filter({ hasText: "New cluster" })
		.getByRole("button", { name: "Expand", exact: true })
		.click();

	await expect(page.getByRole("link", { name: SUBJECT_BIB })).toBeVisible();
	await expect(page.locator('a[href*="/bibs/"]')).toHaveCount(1);
});

// Until 46daf41b the grid opened grouped by incoming bib, and the group row's count was the
// "number of events" the column's own header still promises
test("events are grouped under the bib they explain, with how many there are", async ({
	page,
}) => {
	await page.goto(`/search/${CLUSTER_ID}/clusterExplanation`);

	await expect(
		page.getByRole("row").filter({ hasText: SUBJECT_BIB }).first(),
	).toContainText("(3)");
	await expect(
		page.getByRole("row").filter({ hasText: "New cluster" }),
	).toBeVisible();
});

// "Matched cluster … (merging with [n] …)" read as "Info" until every message format was parsed
test("a merge is named as one, and links to the cluster it merged into", async ({
	page,
}) => {
	await page.goto(`/search/${CLUSTER_ID}/clusterExplanation`);

	await page
		.getByRole("row")
		.filter({ hasText: "Merged clusters" })
		.getByRole("button", { name: "Expand", exact: true })
		.click();

	await expect(
		page
			.getByRole("tabpanel", { name: "Explain clustering" })
			.getByRole("link", { name: CLUSTER_ID })
			.first(),
	).toHaveAttribute("href", new RegExp(`/search/${CLUSTER_ID}/cluster$`));
});

// The query throws, so the tab's own error branch never rendered: the route's does
test("a failure to load is reported inside the cluster page, which stays", async ({
	page,
}) => {
	await page.route("**/clusters/*/audit-log", (route) =>
		route.fulfill({ status: 500, json: {} }),
	);
	await page.goto(`/search/${CLUSTER_ID}/clusterExplanation`);

	await expect(
		page
			.getByRole("tabpanel", { name: "Explain clustering" })
			.getByRole("heading", { name: "500 Server error" }),
	).toBeVisible();
	await expect(page.getByRole("tab", { name: "Items" })).toBeVisible();
});

// Every column is text, so aggregation could only ever count rows, which grouping already does
test("the explanation offers no aggregation", async ({ page }) => {
	await page.goto(`/search/${CLUSTER_ID}/clusterExplanation`);
	const header = page
		.getByRole("columnheader")
		.filter({ hasText: "Event type" })
		.first();
	await header.hover();
	await header.getByRole("button", { name: "Event type column menu" }).click();

	await expect(
		page.getByRole("menu").getByRole("combobox", { name: "Aggregation" }),
	).toHaveCount(0);
});

// "Bib matched against" was 100px wide for a 36-character UUID, and text
test("the bib and cluster an event matched are whole, and links", async ({
	page,
}) => {
	await page.goto(`/search/${CLUSTER_ID}/clusterExplanation?show=matchedBibId`);
	// Grouped rows make the grid a treegrid
	const grid = page.getByRole("treegrid");

	await expect(grid.getByRole("link", { name: MATCHED_BIB })).toHaveAttribute(
		"href",
		new RegExp(`/bibs/${MATCHED_BIB}$`),
	);
	await expect(grid.getByRole("link", { name: CLUSTER_ID })).toHaveAttribute(
		"href",
		new RegExp(`/search/${CLUSTER_ID}/cluster$`),
	);
});

// Sorted newest first on a minute-precision string, a bib's outcome sat above its causes
test("a bib's events read from cause to outcome", async ({ page }) => {
	await page.goto(`/search/${CLUSTER_ID}/clusterExplanation`);
	const rows = page.getByRole("row");
	await expect(rows.filter({ hasText: "Merged clusters" })).toBeVisible();

	const order = await rows.evaluateAll((all) =>
		all
			.map((row) => row.textContent ?? "")
			.map((text) =>
				["New cluster", "Match: shared identifier", "Merged clusters"].find(
					(label) => text.includes(label),
				),
			)
			.filter(Boolean),
	);
	expect(order).toEqual([
		"New cluster",
		"Match: shared identifier",
		"Merged clusters",
	]);
});
