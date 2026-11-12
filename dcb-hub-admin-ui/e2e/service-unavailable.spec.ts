import { test, expect } from "./fixtures/test";
import { ADMIN_ROLES, seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import { CLUSTER_ID, mockClusterRest } from "./fixtures/cluster-mocks";
import { MOCKS } from "./fixtures/routes";

// A 503 sends the app to the maintenance page only when dcb-service itself is down. One
// route answering 503 - a member library's system passed through, say - is that route's.

const CLUSTER = `/search/${CLUSTER_ID}/cluster`;

test.beforeEach(async ({ page }) => {
	await useAllFeatures(page);
	await seedAuth(page, { roles: ADMIN_ROLES });
	await mockGraphQL(page, MOCKS);
	await mockClusterRest(page);
	await page.route("**/clusters/*/reprocess", (route) =>
		route.fulfill({ status: 503, body: "" }),
	);
});

const reprocess = async (page: import("@playwright/test").Page) => {
	await page.getByRole("button", { name: "Actions" }).click();
	await page.getByRole("menuitem", { name: "Reprocess cluster" }).click();
	const dialog = page.getByRole("dialog", { name: "Reprocess this cluster?" });
	await dialog.getByRole("button", { name: "Reprocess" }).click();
	return dialog;
};

test("one route's 503 stays on the page when dcb-service is up", async ({
	page,
}) => {
	let probes = 0;
	await page.route("**/health/liveness", (route) => {
		probes++;
		return route.fulfill({ json: { status: "UP" } });
	});
	await page.goto(CLUSTER);

	const dialog = await reprocess(page);

	await expect(dialog.getByRole("alert")).toBeVisible();
	await expect.poll(() => probes).toBe(1);
	await expect(page).toHaveURL(new RegExp(`${CLUSTER}$`));
});

test("a 503 goes to the maintenance page when dcb-service is down", async ({
	page,
}) => {
	await page.route("**/health/liveness", (route) =>
		route.fulfill({ status: 503, json: { status: "DOWN" } }),
	);
	await page.goto(CLUSTER);

	await reprocess(page);

	await expect(page).toHaveURL(/\/maintenance$/);
});
