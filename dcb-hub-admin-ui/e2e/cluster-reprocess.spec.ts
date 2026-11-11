import { test, expect } from "./fixtures/test";
import { ADMIN_ROLES, seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import { scanForViolations, waitForDialogToSettle } from "./fixtures/axe";
import { CLUSTER_ID, mockClusterRest } from "./fixtures/cluster-mocks";
import { MOCKS } from "./fixtures/routes";

const CLUSTER = `/search/${CLUSTER_ID}/cluster`;

test.beforeEach(async ({ page }) => {
	await useAllFeatures(page);
	await mockGraphQL(page, MOCKS);
	await mockClusterRest(page);
});

const openReprocess = async (page: import("@playwright/test").Page) => {
	await page.getByRole("button", { name: "Actions" }).click();
	await page.getByRole("menuitem", { name: "Reprocess cluster" }).click();
	return page.getByRole("dialog", { name: "Reprocess this cluster?" });
};

test("an ADMIN reprocesses the cluster after confirming, and is told it has started", async ({
	page,
}) => {
	const posts: string[] = [];
	await page.route("**/clusters/*/reprocess", (route) => {
		posts.push(route.request().method());
		return route.fulfill({ status: 202, body: "" });
	});
	await seedAuth(page, { roles: ADMIN_ROLES });
	await page.goto(CLUSTER);

	const dialog = await openReprocess(page);
	expect(posts).toEqual([]);
	await dialog.getByRole("button", { name: "Reprocess" }).click();

	await expect(dialog.getByRole("status")).toContainText(
		"Reprocessing has started.",
	);
	await expect(dialog.getByRole("button", { name: "Close" })).toBeFocused();
	expect(posts).toEqual(["POST"]);
});

test("cancelling sends nothing", async ({ page }) => {
	let posted = false;
	await page.route("**/clusters/*/reprocess", (route) => {
		posted = true;
		return route.fulfill({ status: 202, body: "" });
	});
	await seedAuth(page, { roles: ADMIN_ROLES });
	await page.goto(CLUSTER);

	const dialog = await openReprocess(page);
	await dialog.getByRole("button", { name: "Cancel" }).click();

	await expect(dialog).toHaveCount(0);
	expect(posted).toBe(false);
});

test("says so when dcb-service refuses", async ({ page }) => {
	await page.route("**/clusters/*/reprocess", (route) =>
		route.fulfill({ status: 403, json: {} }),
	);
	await seedAuth(page, { roles: ADMIN_ROLES });
	await page.goto(CLUSTER);

	const dialog = await openReprocess(page);
	await dialog.getByRole("button", { name: "Reprocess" }).click();

	await expect(dialog.getByRole("status")).toContainText(
		"Only administrators can reprocess a cluster.",
	);
});

for (const scheme of ["light", "dark"] as const) {
	test(`the dialog passes axe, ${scheme}`, async ({ page }) => {
		await page.emulateMedia({ colorScheme: scheme });
		await seedAuth(page, { roles: ADMIN_ROLES });
		await page.goto(CLUSTER);

		const dialog = await openReprocess(page);
		await expect(dialog).toContainText("queued to be clustered again");
		await waitForDialogToSettle(page);

		await scanForViolations(page);
	});
}

test("is not offered without ADMIN", async ({ page }) => {
	await seedAuth(page, { roles: ["CONSORTIUM_ADMIN"] });
	await page.goto(CLUSTER);

	await page.getByRole("button", { name: "Actions" }).click();
	await expect(
		page.getByRole("menuitem", { name: "Reprocess cluster" }),
	).toHaveCount(0);
});
