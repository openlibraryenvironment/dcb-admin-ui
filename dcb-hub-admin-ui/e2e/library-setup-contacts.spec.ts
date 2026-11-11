import { test, expect } from "./fixtures/test";
import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import libraryDetail from "./fixtures-data/library-detail.json";

// Setup's Contacts chapter writes only the contacts typed into it, so the ones the library
// already has are shown but changed on the library's own Contacts page

const LIBRARY = libraryDetail.libraries.content[0];
const STORED = {
	id: "c0c0c0c0-1111-5111-9111-111111111111",
	firstName: "Grace",
	lastName: "Hopper",
	email: "grace@example.invalid",
	role: { name: "IMPLEMENTATION_CONTACT" },
	isPrimaryContact: true,
};
const withStoredContact = {
	libraries: {
		...libraryDetail.libraries,
		content: [{ ...LIBRARY, contacts: [STORED] }],
	},
};

test("a stored contact is shown but not offered for change, and only new contacts are written", async ({
	page,
}) => {
	const created: any[] = [];
	await useAllFeatures(page);
	await seedAuth(page);
	await mockGraphQL(page, {
		LoadConsortiumHeader: consortiumBasics,
		LoadLibrary: withStoredContact,
		LoadMappings: { referenceValueMappings: { totalSize: 0, content: [] } },
		LoadNumericRangeMappings: {
			numericRangeMappings: { totalSize: 0, content: [] },
		},
		LoadLocations: { locations: { totalSize: 0, content: [] } },
		CreateLibraryContact: (variables: any) => {
			created.push(variables.input);
			return { createLibraryContact: { id: "c-new" } };
		},
	});
	await page.goto(`/libraries/${LIBRARY.id}/setup/contacts`);
	const main = page.getByRole("main");

	const storedEmail = main.getByRole("textbox", { name: /email/i }).first();
	await expect(storedEmail).toHaveValue(STORED.email);
	await expect(storedEmail).toBeDisabled();
	await expect(
		main.getByRole("checkbox", { name: /primary/i }).first(),
	).toBeDisabled();
	await expect(
		main.getByText(/changed or removed on its Contacts page/i),
	).toBeVisible();

	await main.getByRole("button", { name: /add contact|new contact/i }).click();
	await expect(
		main.getByRole("button", { name: /remove contact 1/i }),
	).toHaveCount(0);
	await main
		.getByRole("textbox", { name: /first name/i })
		.nth(1)
		.fill("Ada");
	await main
		.getByRole("textbox", { name: /last name/i })
		.nth(1)
		.fill("Lovelace");
	await main
		.getByRole("textbox", { name: /email/i })
		.nth(1)
		.fill("ada@example.invalid");
	await main.getByRole("combobox", { name: /role/i }).nth(1).click();
	await page.getByRole("option").first().click();
	// The stored contact is primary, so a new one cannot take that from it here
	await expect(
		main.getByRole("checkbox", { name: /primary/i }).nth(1),
	).toBeDisabled();
	await main.getByRole("button", { name: /continue/i }).click();

	await expect.poll(() => created.length).toBe(1);
	expect(created[0]).toMatchObject({ firstName: "Ada", lastName: "Lovelace" });
});
