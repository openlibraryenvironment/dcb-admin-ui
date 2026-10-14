import { test, expect } from "./fixtures/test";
import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import consortium from "./fixtures-data/consortium.json";
import libraries from "./fixtures-data/libraries.json";
import libraryCount from "./fixtures-data/library-count.json";

const noConsortium = { consortia: { ...consortium.consortia, content: [] } };

// Five required answers on first-run setup, four of them usually the name again
test.describe("Setup: consortium names", () => {
	test.beforeEach(async ({ page }) => {
		await seedAuth(page);
		await mockGraphQL(page, {
			LoadConsortiumHeader: consortiumBasics,
			LoadConsortium: noConsortium,
			LoadLibraries: libraries,
			LoadLibraryCount: libraryCount,
			LoadGroupsSelection: { libraryGroups: { content: [] } },
		});
		await page.goto("/setup/consortium");
	});

	test("fills the display name, group name and group code from the name", async ({
		page,
	}) => {
		await page
			.getByRole("textbox", { name: "Consortium name" })
			.fill("Colorado Alliance of Research Libraries");

		await expect(
			page.getByRole("textbox", { name: "Display name" }),
		).toHaveValue("Colorado Alliance of Research Libraries");
		await expect(page.getByRole("textbox", { name: "Group name" })).toHaveValue(
			"Colorado Alliance of Research Libraries",
		);
		await expect(page.getByRole("textbox", { name: "Group code" })).toHaveValue(
			"CARL",
		);
	});

	test("leaves a value the user changed", async ({ page }) => {
		await page.getByRole("textbox", { name: "Consortium name" }).fill("Demo");
		await page.getByRole("textbox", { name: "Group code" }).fill("MINE");
		await page
			.getByRole("textbox", { name: "Consortium name" })
			.fill("Demo Consortium");

		await expect(page.getByRole("textbox", { name: "Group code" })).toHaveValue(
			"MINE",
		);
		await expect(
			page.getByRole("textbox", { name: "Display name" }),
		).toHaveValue("Demo Consortium");
	});
});
