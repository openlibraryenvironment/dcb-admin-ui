import { test, expect } from "@playwright/test";
import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { scanForViolations } from "./fixtures/axe";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import libraries from "./fixtures-data/libraries.json";

// A ruleset name that matches nothing suppresses nothing, and says so nowhere
test.describe("New Host LMS: suppression ruleset names", () => {
	test.beforeEach(async ({ page }) => {
		await seedAuth(page);
		await mockGraphQL(page, {
			LoadConsortiumHeader: consortiumBasics,
			LoadLibraries: libraries,
		});
		await page.route("**/object-rules?**", (route) =>
			route.fulfill({
				json: {
					content: [{ name: "folio-default" }, { name: "koha-default" }],
					totalSize: 2,
				},
			}),
		);
		await page.goto("/hostlmss/new");
	});

	test("offers the rulesets dcb-service holds", async ({ page }) => {
		await page
			.getByRole("combobox", { name: "Bib suppression ruleset" })
			.click();

		await expect(page.getByRole("option")).toHaveText([
			"folio-default",
			"koha-default",
		]);
	});

	test("says when a typed name matches no ruleset", async ({ page }) => {
		await page
			.getByRole("combobox", { name: "Item suppression ruleset" })
			.fill("folio-defualt");

		await expect(
			page.getByText(/no ruleset called folio-defualt/i),
		).toBeVisible();
	});

	test("says what a blank bib ruleset means on FOLIO", async ({ page }) => {
		await page.getByRole("combobox", { name: "Client class" }).click();
		await page.getByRole("option", { name: "FOLIO" }).click();

		await expect(
			page.getByText("Leave blank to use folio-default."),
		).toBeVisible();
	});

	test("passes axe", async ({ page }) => {
		await expect(
			page.getByRole("combobox", { name: "Bib suppression ruleset" }),
		).toBeVisible();

		await scanForViolations(page);
	});
});
