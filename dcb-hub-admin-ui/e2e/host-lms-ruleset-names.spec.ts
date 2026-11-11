import { test, expect } from "./fixtures/test";
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

// GET /object-rules is ADMIN-only on 8.71.0-9.3.0; createHostLms admits CONSORTIUM_ADMIN
test.describe("New Host LMS without ADMIN: suppression ruleset names", () => {
	test("the form opens, and asks dcb-service for nothing it would refuse", async ({
		page,
	}) => {
		const asked: string[] = [];
		await seedAuth(page, { roles: ["CONSORTIUM_ADMIN", "LIBRARY_ADMIN"] });
		await mockGraphQL(page, {
			LoadConsortiumHeader: consortiumBasics,
			LoadLibraries: libraries,
		});
		await page.route("**/object-rules?**", (route) => {
			asked.push(route.request().url());
			return route.fulfill({ status: 403, json: {} });
		});
		await page.goto("/hostlmss/new");

		const field = page.getByRole("combobox", {
			name: "Item suppression ruleset",
		});
		await field.fill("folio-default");

		await expect(field).toHaveValue("folio-default");
		await expect(page.getByText(/no ruleset called/i)).toHaveCount(0);
		expect(asked).toEqual([]);
	});
});

test.describe("New Host LMS: a refused ruleset list", () => {
	test("leaves the form in place", async ({ page }) => {
		await seedAuth(page);
		await mockGraphQL(page, {
			LoadConsortiumHeader: consortiumBasics,
			LoadLibraries: libraries,
		});
		await page.route("**/object-rules?**", (route) =>
			route.fulfill({ status: 403, json: {} }),
		);
		await page.goto("/hostlmss/new");

		await expect(
			page.getByRole("combobox", { name: "Bib suppression ruleset" }),
		).toBeVisible();
	});
});
