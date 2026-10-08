import { test, expect } from "@playwright/test";

import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import libraries from "./fixtures-data/libraries.json";
import libraryCount from "./fixtures-data/library-count.json";

/**
 * index.html sets one title and four routes never changed it, so login, logout,
 * maintenance and networkError all read "DCB Admin". Browser history, tab
 * switching and a screen reader's page announcement were identical on each.
 * WCAG 2.4.2, Level A - which the VPAT claims. Page name first, because a tab
 * strip truncates from the right.
 */

test("the sign-in page titles itself", async ({ page }) => {
	await page.goto("/login");
	await expect(page).toHaveTitle("Login · DCB Admin");
});

test("the maintenance page titles itself", async ({ page }) => {
	await page.goto("/maintenance");
	await expect(page).toHaveTitle("Maintenance in progress · DCB Admin");
});

test("the network error page titles itself", async ({ page }) => {
	await page.goto("/networkError");
	await expect(page).toHaveTitle("Network error · DCB Admin");
});

test("an authenticated route titles itself, and retitles on navigation", async ({
	page,
}) => {
	await seedAuth(page);
	await mockGraphQL(page, {
		LoadConsortiumHeader: consortiumBasics,
		LoadLibraries: libraries,
		LoadLibraryCount: libraryCount,
	});

	await page.goto("/libraries");
	await expect(page).toHaveTitle(/^Libraries · DCB Admin$/);

	// The title has to follow the route, not just be set once on load.
	await page.goto("/settings");
	await expect(page).toHaveTitle(/^Settings · DCB Admin$/);
});
