import { test, expect, type Page } from "@playwright/test";

import { seedAuth } from "./fixtures/auth";
import { useAllFeatures } from "./fixtures/flags";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import libraryDetail from "./fixtures-data/library-detail.json";

/**
 * The scheme is a choice from a list, and "not stated" is one of the choices: defaulting to
 * Dewey would give a library that shelves by LCC a confidently wrong shelf order. With the
 * flag off, `classificationScheme` must be absent from the query sent, not merely hidden — no
 * dcb-service release declares it, and an undeclared field fails the whole operation.
 */

const LIBRARY_ID = "c23df3ab-77c0-5689-b56d-fc8a2d6a5f22";

async function mockGraphQL(page: Page, sent: string[]) {
	await page.route("**/graphql", async (route) => {
		const body = route.request().postDataJSON();
		sent.push(String(body?.query ?? ""));

		const answers: Record<string, unknown> = {
			LoadConsortiumHeader: consortiumBasics,
			LoadLibrary: libraryDetail,
			LoadLibraryBasics: libraryDetail,
		};

		if (body?.operationName in answers) {
			await route.fulfill({ json: { data: answers[body.operationName] } });
			return;
		}

		await route.continue();
	});
}

test.describe("Shelf classification", () => {
	test("shows the scheme the library declared", async ({ page }) => {
		await useAllFeatures(page);
		await seedAuth(page);
		await mockGraphQL(page, []);

		await page.goto(`/libraries/${LIBRARY_ID}`);

		await expect(page.getByText("Shelf classification")).toBeVisible();
		// The fixture declares DEWEY, and the page shows the name a librarian uses rather
		// than the enum value.
		await expect(page.getByText("Dewey Decimal")).toBeVisible();
	});

	test("offers only the schemes a shelf order can be computed for, plus not stated", async ({
		page,
	}) => {
		await useAllFeatures(page);
		await seedAuth(page);
		await mockGraphQL(page, []);

		await page.goto(`/libraries/${LIBRARY_ID}`);

		// Edit lives behind the page's Actions menu, not on the toolbar.
		await page.getByRole("button", { name: "Actions" }).click();
		await page.getByRole("menuitem", { name: "Edit" }).click();

		await page
			.getByRole("combobox", { name: "Shelf classification" })
			.click();

		const options = page.getByRole("option");
		await expect(options).toHaveText([
			"Not stated",
			"Dewey Decimal",
			"Library of Congress",
		]);
	});

	test("is absent from the query while the flag is off, not merely hidden", async ({
		page,
	}) => {
		// No useAllFeatures: flags default to off, exactly as on a deployment whose
		// dcb-service does not declare the field. Selecting it there is a validation error
		// that fails LoadLibrary whole — the library page, not one row of it.
		const sent: string[] = [];
		await seedAuth(page);
		await mockGraphQL(page, sent);

		await page.goto(`/libraries/${LIBRARY_ID}`);

		await expect(
			page.getByRole("heading", { name: "Alpha Test Library" }),
		).toBeVisible();

		await expect(page.getByText("Shelf classification")).toHaveCount(0);
		expect(
			sent.some((query) => query.includes("classificationScheme")),
			"the library query asked for a field this deployment does not declare",
		).toBe(false);
	});
});
