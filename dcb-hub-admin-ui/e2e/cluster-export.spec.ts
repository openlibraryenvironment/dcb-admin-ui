import { test, expect } from "./fixtures/test";
import { ADMIN_ROLES, seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import { CLUSTER_ID, mockClusterRest } from "./fixtures/cluster-mocks";
import { MOCKS } from "./fixtures/routes";

const CLUSTER = `/search/${CLUSTER_ID}/cluster`;

test.beforeEach(async ({ page }) => {
	await useAllFeatures(page);
	await mockGraphQL(page, MOCKS);
	await mockClusterRest(page);
});

const exportItem = async (
	page: import("@playwright/test").Page,
	visible = true,
) => {
	await page.getByRole("button", { name: "Actions" }).click();
	const item = page.getByRole("menuitem", { name: "Export member records" });
	if (visible) await expect(item).toBeVisible();
	return item;
};

test("an ADMIN downloads the members as a zip, whatever the response says it is", async ({
	page,
}) => {
	await page.route("**/clusters/*/exportMembers", (route) =>
		route.fulfill({
			status: 200,
			contentType: "application/json",
			body: Buffer.from("PK\u0003\u0004 not really a zip"),
		}),
	);
	await seedAuth(page, { roles: ADMIN_ROLES });
	await page.goto(CLUSTER);

	const download = page.waitForEvent("download");
	await (await exportItem(page)).click();

	expect((await download).suggestedFilename()).toBe(
		`cluster-${CLUSTER_ID}-records.zip`,
	);
});

test("says when the cluster has no members to export", async ({ page }) => {
	await page.route("**/clusters/*/exportMembers", (route) =>
		route.fulfill({ status: 204 }),
	);
	await seedAuth(page, { roles: ADMIN_ROLES });
	await page.goto(CLUSTER);

	await (await exportItem(page)).click();

	await expect(page.getByRole("status").first()).toContainText(
		"This cluster has no member records to export.",
	);
});

test("is not offered without ADMIN", async ({ page }) => {
	await seedAuth(page, { roles: ["CONSORTIUM_ADMIN"] });
	await page.goto(CLUSTER);

	await expect(await exportItem(page, false)).toHaveCount(0);
});
