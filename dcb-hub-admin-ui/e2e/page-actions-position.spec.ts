import type { Page } from "@playwright/test";
import { test, expect } from "./fixtures/test";
import { seedAuth } from "./fixtures/auth";
import { mockGraphQL, overrideGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import { CLUSTER_ID, mockClusterRest } from "./fixtures/cluster-mocks";
import { MOCKS } from "./fixtures/routes";
import clusterRecord from "./fixtures-data/cluster-record.json";

// The page's Actions button sits top right, beside the title, on every page. A cluster's
// title is a whole book title, which is what once pushed it to the left of a second line.

const LONG_TITLE =
	"The collected correspondence of a provincial lending library, with an account of its catalogue, its readers and the inter-library loans it arranged across three counties";

const withLongTitle = {
	instanceClusters: {
		...clusterRecord.instanceClusters,
		content: [
			{ ...clusterRecord.instanceClusters.content[0], title: LONG_TITLE },
		],
	},
};

/** Where the Actions button sits against the title row it belongs to. */
const actionsPlacement = (page: Page) =>
	page.getByRole("button", { name: "Actions" }).evaluate((button) => {
		const title = document.getElementById("page-title")!;
		let row = button.parentElement!;
		while (!row.contains(title)) row = row.parentElement!;
		const rowBox = row.getBoundingClientRect();
		const box = button.getBoundingClientRect();
		const titleBox = title.getBoundingClientRect();
		return {
			gapToRight:
				rowBox.right -
				parseFloat(getComputedStyle(row).paddingRight) -
				box.right,
			besideTitle: box.top < titleBox.bottom,
			onScreen: box.right <= document.documentElement.clientWidth,
		};
	});

test.beforeEach(async ({ page }) => {
	await useAllFeatures(page);
	await seedAuth(page);
	await mockGraphQL(page, MOCKS);
	await overrideGraphQL(page, { ClusterRecordsTitleOnly: withLongTitle });
	await mockClusterRest(page);
});

test("a long title leaves Actions top right, on the title's row", async ({
	page,
}) => {
	await page.goto(`/search/${CLUSTER_ID}/cluster`);
	await expect(page.locator("#page-title")).toContainText(LONG_TITLE);

	const placement = await actionsPlacement(page);
	expect(placement.gapToRight).toBeLessThanOrEqual(1);
	expect(placement.besideTitle).toBe(true);
});

test("at 320px Actions may drop under the title, but stays at the right", async ({
	page,
}) => {
	await page.setViewportSize({ width: 320, height: 640 });
	await page.goto(`/search/${CLUSTER_ID}/cluster`);
	await expect(page.locator("#page-title")).toContainText(LONG_TITLE);

	const placement = await actionsPlacement(page);
	expect(placement.gapToRight).toBeLessThanOrEqual(1);
	expect(placement.onScreen).toBe(true);
});
