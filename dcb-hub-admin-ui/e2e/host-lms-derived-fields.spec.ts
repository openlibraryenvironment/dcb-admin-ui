import { test, expect } from "./fixtures/test";
import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import libraries from "./fixtures-data/libraries.json";

// An appliance's base URL is the origin of its OAI-PMH endpoint, which is what dcb-service
// writes for an appliance it registers itself
test.describe("New Host LMS: derived settings", () => {
	test.beforeEach(async ({ page }) => {
		await seedAuth(page);
		await mockGraphQL(page, {
			LoadConsortiumHeader: consortiumBasics,
			LoadLibraries: libraries,
		});
		await page.goto("/hostlmss/new");
		await page.getByRole("combobox", { name: "Client class" }).click();
		await page.getByRole("option", { name: "OpenRS Appliance system" }).click();
		// The endpoint URL is the override for a non-standard path, under Advanced
		for (const section of await page
			.getByRole("button", { name: /advanced settings/i })
			.all())
			await section.click();
	});

	test("fills the appliance base URL from its OAI endpoint", async ({
		page,
	}) => {
		await page
			.getByRole("textbox", { name: "OAI-PMH endpoint URL" })
			.fill("https://appliance.example.org:8443/oai/request");

		await expect(page.getByRole("textbox", { name: "Base URL" })).toHaveValue(
			"https://appliance.example.org:8443",
		);
	});

	test("stops once the base URL has been changed by hand", async ({ page }) => {
		await page
			.getByRole("textbox", { name: "Base URL" })
			.fill("https://elsewhere.example.org");
		await page
			.getByRole("textbox", { name: "OAI-PMH endpoint URL" })
			.fill("https://appliance.example.org/oai");

		await expect(page.getByRole("textbox", { name: "Base URL" })).toHaveValue(
			"https://elsewhere.example.org",
		);
	});
});
