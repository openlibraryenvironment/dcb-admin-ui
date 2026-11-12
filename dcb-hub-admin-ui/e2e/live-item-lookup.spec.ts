import { test, expect } from "./fixtures/test";
import { ADMIN_ROLES, seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import { scanForViolations, waitForDialogToSettle } from "./fixtures/axe";
import { CLUSTER_ID, mockClusterRest } from "./fixtures/cluster-mocks";
import { MOCKS } from "./fixtures/routes";

const ITEMS = `/search/${CLUSTER_ID}/items`;
const LOOK_UP = "Ask the library's system about item 30000000000001";

test.beforeEach(async ({ page }) => {
	await useAllFeatures(page);
	await mockGraphQL(page, MOCKS);
	await mockClusterRest(page);
});

test("an ADMIN can ask the item's own system about it", async ({ page }) => {
	const asked: string[] = [];
	await page.route("**/hostlmss/*/item/*", async (route) => {
		asked.push(new URL(route.request().url()).pathname);
		await route.fulfill({
			json: { status: "LOANED", rawStatus: "Checked out", holdCount: 2 },
		});
	});
	await seedAuth(page, { roles: ADMIN_ROLES });
	await page.goto(ITEMS);

	await page.getByRole("button", { name: LOOK_UP }).first().click();

	const dialog = page.getByRole("dialog", {
		name: "Item 30000000000001 in alpha-lms",
	});
	await expect(
		dialog.getByRole("row", { name: "Status LOANED" }),
	).toBeVisible();
	await expect(dialog.getByRole("row", { name: "Holds 2" })).toBeVisible();
	expect(asked).toHaveLength(1);
	expect(asked[0]).toMatch(/\/hostlmss\/alpha-lms\/item\/30000000000001$/);
});

test("says when the system has no such item", async ({ page }) => {
	await page.route("**/hostlmss/*/item/*", (route) =>
		route.fulfill({ status: 404, json: { message: "Item not found" } }),
	);
	await seedAuth(page, { roles: ADMIN_ROLES });
	await page.goto(ITEMS);

	await page.getByRole("button", { name: LOOK_UP }).first().click();

	await expect(page.getByRole("dialog").getByRole("status")).toContainText(
		"alpha-lms has no item with barcode 30000000000001",
	);
});

test("is not offered without ADMIN", async ({ page }) => {
	await seedAuth(page, { roles: ["CONSORTIUM_ADMIN"] });
	await page.goto(ITEMS);
	await expect(page.getByRole("grid").first()).toBeVisible();

	await expect(page.getByRole("button", { name: LOOK_UP })).toHaveCount(0);
});

for (const scheme of ["light", "dark"] as const) {
	test(`the lookup passes axe, ${scheme}`, async ({ page }) => {
		await page.emulateMedia({ colorScheme: scheme });
		await page.route("**/hostlmss/*/item/*", (route) =>
			route.fulfill({
				json: { status: "AVAILABLE", barcode: "30000000000001" },
			}),
		);
		await seedAuth(page, { roles: ADMIN_ROLES });
		await page.goto(ITEMS);
		await page.getByRole("button", { name: LOOK_UP }).first().click();
		await expect(
			page.getByRole("dialog").getByRole("row", { name: "Status AVAILABLE" }),
		).toBeVisible();
		await waitForDialogToSettle(page);

		await scanForViolations(page);
	});
}

// A boolean was printed as the raw "true" or "false"
test("a yes-or-no answer reads as Yes or No", async ({ page }) => {
	await page.route("**/hostlmss/*/item/*", (route) =>
		route.fulfill({ json: { status: "AVAILABLE", renewable: false } }),
	);
	await seedAuth(page, { roles: ADMIN_ROLES });
	await page.goto(ITEMS);

	await page.getByRole("button", { name: LOOK_UP }).first().click();

	const dialog = page.getByRole("dialog", {
		name: "Item 30000000000001 in alpha-lms",
	});
	await expect(dialog.getByRole("row", { name: /No$/ })).toBeVisible();
	await expect(dialog.getByText("false", { exact: true })).toHaveCount(0);
});
