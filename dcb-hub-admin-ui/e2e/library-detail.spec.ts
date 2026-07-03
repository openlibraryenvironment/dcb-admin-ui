import { test, expect } from "@playwright/test";
import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import libraryDetail from "./fixtures-data/library-detail.json";

const LIBRARY_ID = "c23df3ab-77c0-5689-b56d-fc8a2d6a5f22";

test.describe("Library detail page", () => {
	test.beforeEach(async ({ page }) => {
		await seedAuth(page);
		await mockGraphQL(page, {
			LoadConsortiumHeader: consortiumBasics,
			LoadLibrary: libraryDetail,
		});
	});

	test("renders core library fields from the mocked query", async ({
		page,
	}) => {
		await page.goto(`/libraries/${LIBRARY_ID}`);

		await expect(
			page.getByRole("heading", { name: "Alpha Test Library" }),
		).toBeVisible();
		await expect(page.getByText("1 Alpha Street")).toBeVisible();
	});

	test("navigates between the library's sub-page tabs", async ({ page }) => {
		await page.goto(`/libraries/${LIBRARY_ID}`);
		await expect(
			page.getByRole("heading", { name: "Alpha Test Library" }),
		).toBeVisible();

		await page.getByRole("tab", { name: /contacts/i }).click();
		await expect(page).toHaveURL(
			new RegExp(`/libraries/${LIBRARY_ID}/contacts`),
		);
	});
});
