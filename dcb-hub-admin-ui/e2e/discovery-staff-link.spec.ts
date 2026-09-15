import { expect, test } from "@playwright/test";

import { ADMIN_ROLES, seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import consortium from "./fixtures-data/consortium.json";

/** Discovery's front page and search settings are edited in symposia-ui - docs/deployment.md. */

const MOCKS = {
	LoadConsortiumHeader: consortiumBasics,
	LoadConsortium: consortium,
};

const LINK_NAME = "Open discovery staff settings";

test.describe("the link to discovery's staff settings", () => {
	test.beforeEach(async ({ page }) => {
		await useAllFeatures(page);
		await seedAuth(page, { roles: ADMIN_ROLES });
		await mockGraphQL(page, MOCKS);
	});

	test("opens discovery's staff pages", async ({ page }) => {
		await page.goto("/consortium/branding");

		await expect(page.getByRole("link", { name: LINK_NAME })).toHaveAttribute(
			"href",
			"https://discovery.e2e.invalid/staff",
		);
	});

	test("is not offered when the deployment names no discovery app", async ({
		page,
	}) => {
		await page.addInitScript(() => {
			delete window.__APP_ENV__?.VITE_DISCOVERY_URL;
		});
		await page.goto("/consortium/branding");

		await expect(
			page.getByRole("heading", { name: "Patron-facing brand" }),
		).toBeVisible();
		await expect(page.getByRole("link", { name: LINK_NAME })).toHaveCount(0);
	});
});
