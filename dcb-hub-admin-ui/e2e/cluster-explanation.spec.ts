import { test, expect } from "./fixtures/test";
import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import { CLUSTER_ID, mockClusterRest } from "./fixtures/cluster-mocks";
import { MOCKS } from "./fixtures/routes";

// From e2e/fixtures-data/cluster-audit-log.json: one match event, one new-cluster event.
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
		.filter({ hasText: "Match - high confidence" })
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
		.filter({ hasText: "New Cluster" })
		.getByRole("button", { name: "Expand", exact: true })
		.click();

	await expect(page.getByRole("link", { name: SUBJECT_BIB })).toBeVisible();
	await expect(page.locator('a[href*="/bibs/"]')).toHaveCount(1);
});
