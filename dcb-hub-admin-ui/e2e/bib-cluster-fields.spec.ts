import { test, expect } from "./fixtures/test";
import { seedAuth } from "./fixtures/auth";
import { mockGraphQL, overrideGraphQL } from "./fixtures/graphql-mocks";
import { seedDeployment, useAllFeatures } from "./fixtures/flags";
import { MOCKS } from "./fixtures/routes";
import bibDetail from "./fixtures-data/bib-detail.json";

const BIB_ID = "bb220000-2222-5222-9222-bbbbbbbbbbbb";

test.beforeEach(async ({ page }) => {
	await useAllFeatures(page);
	await mockGraphQL(page, MOCKS);
	await overrideGraphQL(page, {
		LoadBibMainDetails: bibDetail,
		LoadBibSourceRecord: bibDetail,
	});
	await seedAuth(page);
});

// The cluster's title was labelled "Contributors"
test("the cluster's title and id are labelled as the cluster's", async ({
	page,
}) => {
	await page.goto(`/bibs/${BIB_ID}`);

	await expect(page.getByText("Cluster title", { exact: true })).toBeVisible();
	await expect(page.getByText("Cluster UUID", { exact: true })).toBeVisible();
	await expect(page.getByText("Contributors", { exact: true })).toHaveCount(0);
});

// It linked only when VITE_DCB_SEARCH_BASE was set, and then to /search/undefined/cluster
test("the cluster id links to the cluster page, whatever the deployment's search base", async ({
	page,
}) => {
	await seedDeployment(page, { VITE_DCB_SEARCH_BASE: "" });
	await page.goto(`/bibs/${BIB_ID}`);

	await expect(
		page.getByRole("link", { name: "aa110000-1111-5111-9111-aaaaaaaaaaaa" }),
	).toHaveAttribute(
		"href",
		/\/search\/aa110000-1111-5111-9111-aaaaaaaaaaaa\/cluster$/,
	);
});

test("a bib in no cluster offers no cluster link", async ({ page }) => {
	const unclustered = structuredClone(bibDetail);
	for (const bib of unclustered.sourceBibs.content)
		(bib as { contributesTo: unknown }).contributesTo = null;
	await overrideGraphQL(page, {
		LoadBibMainDetails: unclustered,
		LoadBibSourceRecord: unclustered,
	});
	await page.goto(`/bibs/${BIB_ID}`);
	await expect(page.getByText("Cluster UUID", { exact: true })).toBeVisible();

	await expect(page.locator('a[href*="/search/undefined"]')).toHaveCount(0);
});
