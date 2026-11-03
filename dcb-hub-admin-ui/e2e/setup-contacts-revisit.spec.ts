import { test, expect } from "./fixtures/test";
import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import consortium from "./fixtures-data/consortium.json";
import libraryCount from "./fixtures-data/library-count.json";

/**
 * The Contacts chapter adds a contact. Coming back to it once the consortium has one
 * must not demand another before letting the user move on.
 */
test("a consortium that has a contact can move on from Contacts without adding one", async ({
	page,
}) => {
	await useAllFeatures(page);
	await seedAuth(page);
	let contactsCreated = 0;
	await mockGraphQL(page, {
		LoadConsortiumHeader: consortiumBasics,
		LoadConsortium: consortium,
		LoadLibraryCount: libraryCount,
		CreateConsortiumContact: () => {
			contactsCreated++;
			return { createConsortiumContact: { id: "c-2" } };
		},
	});

	await page.goto("/setup/contacts");
	await expect(page.getByText("contact@example.invalid")).toBeVisible();

	await page.getByRole("button", { name: /^continue$/i }).click();

	await expect(page).toHaveURL(/\/setup\/discovery/);
	expect(contactsCreated).toBe(0);
	await expect(
		page
			.getByRole("navigation", { name: "Setup progress" })
			.locator(".MuiStep-root")
			.filter({ hasText: "Contacts" }),
	).toContainText(/done/i);
});

test("typing a new contact on a revisit still saves it", async ({ page }) => {
	await useAllFeatures(page);
	await seedAuth(page);
	let contactsCreated = 0;
	await mockGraphQL(page, {
		LoadConsortiumHeader: consortiumBasics,
		LoadConsortium: consortium,
		LoadLibraryCount: libraryCount,
		CreateConsortiumContact: () => {
			contactsCreated++;
			return { createConsortiumContact: { id: "c-2" } };
		},
	});

	await page.goto("/setup/contacts");
	await page.getByRole("textbox", { name: /first name/i }).fill("Ada");
	await page.getByRole("textbox", { name: /last name/i }).fill("Lovelace");
	await page
		.getByRole("textbox", { name: /email/i })
		.fill("ada@example.invalid");
	await page.getByRole("combobox", { name: /role/i }).click();
	await page.getByRole("option").first().click();
	await page.getByRole("button", { name: /save and continue/i }).click();

	await expect(page).toHaveURL(/\/setup\/discovery/);
	expect(contactsCreated).toBe(1);
});
