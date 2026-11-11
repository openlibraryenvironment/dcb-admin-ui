import { test, expect } from "./fixtures/test";
import { seedAuth } from "./fixtures/auth";
import { mockGraphQL, overrideGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import { CLUSTER_ID, mockClusterRest } from "./fixtures/cluster-mocks";
import { MOCKS } from "./fixtures/routes";

test.beforeEach(async ({ page }) => {
	await useAllFeatures(page);
	await mockGraphQL(page, MOCKS);
	await mockClusterRest(page);
	await overrideGraphQL(page, {
		LoadHostLmsSelection: {
			hostLms: {
				totalSize: 1,
				content: [
					{
						id: "cc330000-3333-5333-9333-cccccccccccc",
						code: "alpha-lms",
						name: "Alpha LMS",
						lmsClientClass: null,
					},
				],
			},
		},
	});
	await seedAuth(page);
});

// The members grid had a single Title column
test("each member says whose it is, how it was processed, and whether it is selected", async ({
	page,
}) => {
	await page.goto(`/search/${CLUSTER_ID}/cluster`);
	const member = page
		.getByRole("row")
		.filter({ hasText: "Alpha and the art of clustering" });

	for (const text of [
		"Selected",
		"Alpha LMS",
		"b1234567",
		"Lovelace, Ada",
		"SUCCESS",
		"2026-09-30",
	])
		await expect(member).toContainText(text);
});
