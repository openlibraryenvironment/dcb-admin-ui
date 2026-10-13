import { test, expect } from "./fixtures/test";
import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { scanForViolations } from "./fixtures/axe";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import libraries from "./fixtures-data/libraries.json";

// Polaris' shelf location policies were a JSON textarea whose example used a policy name
// the validator rejects
test.describe("New Host LMS: shelf location policies", () => {
	test.beforeEach(async ({ page }) => {
		await seedAuth(page);
		await mockGraphQL(page, {
			LoadConsortiumHeader: consortiumBasics,
			LoadLibraries: libraries,
		});
		await page.goto("/hostlmss/new");
		await page.getByRole("combobox", { name: "Client class" }).click();
		await page.getByRole("option", { name: "Polaris" }).click();
	});

	test("are rows of a shelf location and a policy from the list", async ({
		page,
	}) => {
		const policies = page.getByRole("group", { name: /shelf location polic/i });
		await policies
			.getByRole("button", { name: "Add a shelf location" })
			.click();
		await policies
			.getByRole("textbox", { name: "Shelf location" })
			.fill("Reference");
		await policies.getByRole("combobox", { name: "Loan policy" }).click();

		await expect(page.getByRole("option")).toHaveText([
			"General loan",
			"Short loan",
			"Reference only",
			"Local patrons only",
			"Not lent",
		]);
		await page.getByRole("option", { name: "Reference only" }).click();
		await expect(page.locator("li[data-value]")).toHaveCount(0);

		await policies
			.getByRole("button", { name: "Remove shelf location Reference" })
			.click();
		await expect(
			policies.getByRole("textbox", { name: "Shelf location" }),
		).toHaveCount(0);
	});

	for (const scheme of ["light", "dark"] as const) {
		test(`pass axe with a row added, ${scheme}`, async ({ page }) => {
			await page.emulateMedia({ colorScheme: scheme });
			await page
				.getByRole("group", { name: /shelf location polic/i })
				.getByRole("button", { name: "Add a shelf location" })
				.click();

			await scanForViolations(page);
		});
	}
});
