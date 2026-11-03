import { test, expect } from "./fixtures/test";
import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import consortium from "./fixtures-data/consortium.json";
import libraryCount from "./fixtures-data/library-count.json";

test.describe("Setup - discovery branding chapter", () => {
	let updates = 0;

	test.beforeEach(async ({ page }) => {
		updates = 0;
		await useAllFeatures(page);
		await seedAuth(page);
		await mockGraphQL(page, {
			LoadConsortiumHeader: consortiumBasics,
			LoadConsortium: consortium,
			LoadLibraryCount: libraryCount,
			UpdateConsortium: () => {
				updates++;
				return { updateConsortium: { id: consortium.consortia.content[0].id } };
			},
		});
		await page.goto("/setup/discovery");
	});

	test("puts focus on the field that is wrong when saving fails validation", async ({
		page,
	}) => {
		const logoUrl = page
			.getByRole("textbox", { name: "Or paste a web address" })
			.first();
		await logoUrl.fill("not a web address");
		await page.getByRole("button", { name: /save and continue/i }).click();

		await expect(logoUrl).toBeFocused();
		await expect(logoUrl).toHaveAttribute("aria-invalid", "true");
		expect(updates).toBe(0);
	});

	test("moving on without changing anything writes nothing", async ({
		page,
	}) => {
		await page.getByRole("button", { name: /^continue$/i }).click();

		await expect(page).toHaveURL(/\/setup\/libraries/);
		expect(updates).toBe(0);
	});
});
