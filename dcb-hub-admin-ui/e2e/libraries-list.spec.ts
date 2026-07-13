import { test, expect } from "@playwright/test";
import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import libraries from "./fixtures-data/libraries.json";

test.describe("Libraries list", () => {
	test.beforeEach(async ({ page }) => {
		await seedAuth(page);
		await mockGraphQL(page, {
			LoadConsortiumHeader: consortiumBasics,
			LoadLibraries: libraries,
		});
	});

	test("loads and renders rows from the mocked query", async ({ page }) => {
		await page.goto("/libraries");

		await expect(page.getByText("Alpha Test Library")).toBeVisible();
		await expect(page.getByText("Beta Test Library")).toBeVisible();
	});

	test("filter panel opens from the toolbar", async ({ page }) => {
		// ExportToolbar (the app's custom toolbar, now used for every grid
		// type) exposes filtering via a "Filters" icon button that opens the
		// standard filter panel, not a quick-filter search box.
		await page.goto("/libraries");
		await expect(page.getByText("Alpha Test Library")).toBeVisible();

		await page.getByRole("button", { name: "Filters" }).click();
		await expect(page.locator(".MuiDataGrid-panel")).toBeVisible();
	});

	test("row click navigates to the library detail page", async ({ page }) => {
		await page.goto("/libraries");
		await page.getByText("Alpha Test Library").click();

		await expect(page).toHaveURL(
			/\/libraries\/c23df3ab-77c0-5689-b56d-fc8a2d6a5f22/,
		);
	});
});
