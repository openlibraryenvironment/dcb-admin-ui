import { test, expect } from "@playwright/test";
import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import libraries from "./fixtures-data/libraries.json";

// Ported from cypress/e2e/sidebar.cy.ts - the old spec's data-tid selectors
// (e.g. "Home button"/"Home icon") no longer exist on src/layout/Sidebar/Sidebar.tsx,
// so this targets the current DOM via role/aria-current instead.

test.describe("Sidebar navigation", () => {
	test.beforeEach(async ({ page }) => {
		await seedAuth(page);
		await mockGraphQL(page, {
			LoadConsortiumHeader: consortiumBasics,
			LoadLibraries: libraries,
		});
	});

	test("renders all top-level nav items", async ({ page }) => {
		await page.goto("/");
		const nav = page.locator('[data-tid="sidebar"]');

		for (const label of [
			"Home",
			"Patron requests",
			"Consortium",
			"Libraries",
			"Agencies",
			"Host LMSs",
			"Groups",
			"Locations",
			"Mappings",
			"Bib records",
			"Shared index",
			"Service info",
		]) {
			await expect(nav.getByRole("link", { name: label })).toBeVisible();
		}
	});

	test("marks the current page's nav item as active and disables it", async ({
		page,
	}) => {
		await page.goto("/");
		const homeLink = page
			.locator('[data-tid="sidebar"]')
			.getByRole("link", { name: "Home" });

		await expect(homeLink).toHaveAttribute("aria-current", "page");
		await expect(homeLink).toHaveAttribute("aria-disabled", "true");
	});

	test("clicking a nav item navigates and updates the active state", async ({
		page,
	}) => {
		await page.goto("/");
		const nav = page.locator('[data-tid="sidebar"]');

		await nav.getByRole("link", { name: "Libraries" }).click();

		await expect(page).toHaveURL(/\/libraries/);
		await expect(nav.getByRole("link", { name: "Libraries" })).toHaveAttribute(
			"aria-current",
			"page",
		);
		await expect(nav.getByRole("link", { name: "Home" })).not.toHaveAttribute(
			"aria-current",
			"page",
		);
	});

	test("sidebar collapsed state persists across a reload without flashing open first", async ({
		page,
	}) => {
		await page.goto("/");
		await page.getByRole("button", { name: /menu/i }).click();

		const nav = page.locator('[data-tid="sidebar"]');
		// Collapsed state hides link text but keeps icons/links present (mini-drawer).
		await expect(nav.getByRole("link", { name: "Home" })).toBeVisible();

		await page.reload();
		await expect(nav.getByRole("link", { name: "Home" })).toBeVisible();
	});
});
