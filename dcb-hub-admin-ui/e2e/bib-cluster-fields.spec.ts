import { test, expect } from "./fixtures/test";
import { seedAuth } from "./fixtures/auth";
import { mockGraphQL, overrideGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
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
