import { expect, test, type Page } from "@playwright/test";

import { ADMIN_ROLES, seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures, useAllFeaturesExcept } from "./fixtures/flags";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import consortium from "./fixtures-data/consortium.json";
import libraryDetail from "./fixtures-data/library-detail.json";

/**
 * What a consortium that does not run Symposia is shown — VITE_FEATURE_SYMPOSIA.
 *
 * Every case runs the newest dcb-service with every other flag on, so anything missing here
 * is missing because there is no discovery front end to configure, not because the server
 * is too old. Each is paired with the same assertion under Symposia, because a selector
 * that matches nothing would otherwise prove the gate works when it does not.
 */

const LIBRARY_ID = "c23df3ab-77c0-5689-b56d-fc8a2d6a5f22";

const MOCKS = {
	LoadConsortiumHeader: consortiumBasics,
	LoadConsortium: consortium,
	LoadLibrary: libraryDetail,
	LoadLibraryBasics: libraryDetail,
};

/** The GraphQL each page sent, for asserting on the document and not only the render. */
async function recordQueries(page: Page, sent: string[]) {
	await page.route("**/graphql", async (route) => {
		sent.push(String(route.request().postDataJSON()?.query ?? ""));
		await route.fallback();
	});
}

test.describe("without Symposia", () => {
	// In a beforeEach rather than a named helper: the fixtures are called use*, and
	// eslint-plugin-react-hooks reads a use* call inside a named function as a hook.
	test.beforeEach(async ({ page }) => {
		await useAllFeaturesExcept(page, ["VITE_FEATURE_SYMPOSIA"]);
		await seedAuth(page, { roles: ADMIN_ROLES });
		await mockGraphQL(page, MOCKS);
	});

	test("the consortium has no announcements tab", async ({ page }) => {
		await page.goto("/consortium");

		await expect(page.getByRole("tab", { name: "Branding" })).toBeVisible();
		await expect(page.getByRole("tab", { name: "Announcements" })).toHaveCount(
			0,
		);
	});

	test("branding keeps this console's own mark and drops the patron fields", async ({
		page,
	}) => {
		await page.goto("/consortium/branding");

		// The logo and header icon are what DCB Admin puts in its own app bar, so they
		// stay: a consortium without Symposia still brands this console.
		await expect(
			page.getByText("Consortium mark", { exact: true }),
		).toBeVisible();
		await expect(page.getByText("Logo", { exact: true })).toBeVisible();
		await expect(page.getByText("Header icon", { exact: true })).toBeVisible();

		await expect(
			page.getByText("Landing background", { exact: true }),
		).toHaveCount(0);
		await expect(
			page.getByText("Discovery theme", { exact: true }),
		).toHaveCount(0);
		await expect(
			page.getByText("Welcome message", { exact: true }),
		).toHaveCount(0);
	});

	test("a library is not asked which classification it shelves by", async ({
		page,
	}) => {
		const sent: string[] = [];
		await recordQueries(page, sent);
		await page.goto(`/libraries/${LIBRARY_ID}`);

		await expect(
			page.getByRole("heading", { name: "Alpha Test Library" }),
		).toBeVisible();
		await expect(page.getByText("Shelf classification")).toHaveCount(0);
		// The field is gated in the DOCUMENT, not merely hidden: no dcb-service release
		// declares it, and asking for it fails the whole library query.
		expect(
			sent.some((query) => query.includes("classificationScheme")),
			"the library query asked for a field this deployment does not use",
		).toBe(false);
	});
});

test.describe("with Symposia", () => {
	test.beforeEach(async ({ page }) => {
		await useAllFeatures(page);
		await seedAuth(page, { roles: ADMIN_ROLES });
		await mockGraphQL(page, MOCKS);
	});

	test("the consortium has an announcements tab", async ({ page }) => {
		await page.goto("/consortium");

		await expect(
			page.getByRole("tab", { name: "Announcements" }),
		).toBeVisible();
	});

	test("branding offers the patron-facing fields", async ({ page }) => {
		await page.goto("/consortium/branding");

		await expect(
			page.getByText("Patron-facing brand", { exact: true }),
		).toBeVisible();
		await expect(
			page.getByText("Landing background", { exact: true }),
		).toBeVisible();
		await expect(
			page.getByText("Discovery theme", { exact: true }),
		).toBeVisible();
		await expect(
			page.getByText("Welcome message", { exact: true }),
		).toBeVisible();
	});

	test("a library is asked which classification it shelves by", async ({
		page,
	}) => {
		await page.goto(`/libraries/${LIBRARY_ID}`);

		await expect(page.getByText("Shelf classification")).toBeVisible();
	});
});
