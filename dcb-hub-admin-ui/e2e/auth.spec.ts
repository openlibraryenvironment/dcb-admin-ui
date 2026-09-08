import { test, expect } from "@playwright/test";
import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import libraries from "./fixtures-data/libraries.json";

test.describe("Authentication gate", () => {
	test("unauthenticated visit redirects to /login", async ({ page }) => {
		await page.goto("/");
		await expect(page).toHaveURL(/\/login/);
		await expect(page.getByRole("button", { name: /login/i })).toBeVisible();
	});

	test("visiting a protected route while unauthenticated preserves the redirect target", async ({
		page,
	}) => {
		await page.goto("/libraries");
		await expect(page).toHaveURL(/\/login\?redirect=%2Flibraries/);
	});

	test("seeded auth session lands on the authenticated home page", async ({
		page,
	}) => {
		await seedAuth(page);
		await mockGraphQL(page, {
			LoadConsortiumHeader: consortiumBasics,
			LoadLibraries: libraries,
		});

		await page.goto("/");

		await expect(page).toHaveURL("/");
		await expect(page.locator('[data-tid="sidebar"]')).toBeVisible();
		// Fake profile has no given_name/name, so Home falls back to the
		// guest greeting - a deterministic signal auth actually took effect.
		await expect(
			page.getByRole("heading", { name: "Welcome Guest" }),
		).toBeVisible();
	});
});
