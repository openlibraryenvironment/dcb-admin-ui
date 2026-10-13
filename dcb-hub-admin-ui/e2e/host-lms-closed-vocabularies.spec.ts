import { type Page } from "@playwright/test";
import { test, expect } from "./fixtures/test";
import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { scanForViolations } from "./fixtures/axe";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import libraries from "./fixtures-data/libraries.json";

// Settings dcb-service reads from a closed set are chosen, not typed, and settings that
// mean nothing in the configuration chosen are not shown
const chooseClass = async (page: Page, name: string) => {
	await page.getByRole("combobox", { name: "Client class" }).click();
	await page.getByRole("option", { name }).click();
};

const choose = async (page: Page, field: string, option: string | RegExp) => {
	await page.getByRole("combobox", { name: field }).click();
	await page.getByRole("option", { name: option }).click();
	// The menu fades out after a choice; scanning before it has gone measures the fade
	await expect(page.locator("li[data-value]")).toHaveCount(0);
};

test.describe("New Host LMS: closed vocabularies", () => {
	test.beforeEach(async ({ page }) => {
		await seedAuth(page);
		await mockGraphQL(page, {
			LoadConsortiumHeader: consortiumBasics,
			LoadLibraries: libraries,
		});
		await page.goto("/hostlmss/new");
	});

	test("Alma's API URL is one of the six regional gateways", async ({
		page,
	}) => {
		await chooseClass(page, "Alma");
		await page.getByRole("combobox", { name: "Alma API URL" }).click();

		await expect(page.getByRole("option")).toHaveCount(6);
		await expect(page.getByRole("option", { name: /Europe/ })).toBeVisible();
	});

	test("roles are two checkboxes", async ({ page }) => {
		await chooseClass(page, "Alma");
		const roles = page.getByRole("group", { name: "Roles" });

		await expect(roles.getByRole("checkbox")).toHaveCount(2);
	});

	test("a Foundation host asks for the SIP2 socket only when it speaks SIP2", async ({
		page,
	}) => {
		await chooseClass(page, "Foundation connector system");

		await expect(
			page.getByRole("textbox", { name: "NCIP endpoint URL" }),
		).toBeVisible();
		expect(await page.getByRole("textbox", { name: "SIP2 host" }).count()).toBe(
			0,
		);

		await choose(page, "Base protocol", "SIP2");

		await expect(
			page.getByRole("textbox", { name: "SIP2 host" }),
		).toBeVisible();
		expect(
			await page.getByRole("textbox", { name: "NCIP endpoint URL" }).count(),
		).toBe(0);
	});

	test("the appliance asks for token settings only when it requires them", async ({
		page,
	}) => {
		await chooseClass(page, "OpenRS Appliance system");
		expect(
			await page
				.getByRole("textbox", { name: "Approved token issuer" })
				.count(),
		).toBe(0);

		await choose(page, "Peer authentication mode", /JWT_REQUIRED/);

		await expect(
			page.getByRole("textbox", { name: "Approved token issuer" }),
		).toBeVisible();
	});

	for (const scheme of ["light", "dark"] as const) {
		test(`the new controls pass axe, ${scheme}`, async ({ page }) => {
			await page.emulateMedia({ colorScheme: scheme });
			await chooseClass(page, "OpenRS Appliance system");
			await choose(page, "Peer authentication mode", /JWT_REQUIRED/);

			await scanForViolations(page);
		});
	}
});
