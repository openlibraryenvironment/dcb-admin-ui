import { type Page } from "@playwright/test";
import { test, expect } from "./fixtures/test";
import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import libraryDetail from "./fixtures-data/library-detail.json";
import resolvedSettings from "./fixtures-data/resolved-functional-settings.json";

// The Library chapter of a library that already exists: updateLibrary cannot move it to
// another agency, and updateAgency writes to whichever agency its code names

const LIBRARY = libraryDetail.libraries.content[0];

test.beforeEach(async ({ page }) => {
	await useAllFeatures(page);
});

const open = async (
	page: Page,
	roles: string[],
	sent: { operation: string; input: any }[],
) => {
	await seedAuth(page, { roles });
	await mockGraphQL(page, {
		LoadConsortiumHeader: consortiumBasics,
		LoadLibrary: libraryDetail,
		LoadAgencies: {
			agencies: {
				totalSize: 2,
				content: [
					{ code: LIBRARY.agencyCode, name: "Alpha Agency" },
					{ code: "beta", name: "Beta Agency" },
				],
			},
		},
		LoadMappings: { referenceValueMappings: { totalSize: 0, content: [] } },
		LoadNumericRangeMappings: {
			numericRangeMappings: { totalSize: 0, content: [] },
		},
		LoadLocations: { locations: { totalSize: 0, content: [] } },
		UpdateLibrary: (variables: any) => {
			sent.push({ operation: "library", input: variables.input });
			return { updateLibrary: { id: LIBRARY.id } };
		},
		UpdateAgency: (variables: any) => {
			sent.push({ operation: "agency", input: variables.input });
			return { updateAgency: { id: LIBRARY.agency.id } };
		},
	});
	await page.goto(`/libraries/${LIBRARY.id}/setup/profile`);
	await expect(page.getByLabel("Full name")).toHaveValue(LIBRARY.fullName);
	// The fixture library has no coordinates, which the chapter requires
	await page.getByLabel(/latitude/i).fill("51.5");
	await page.getByLabel(/longitude/i).fill("-0.12");
};

test("an existing library's agency and sign-in are fixed, and its agency is updated by its own code", async ({
	page,
}) => {
	const sent: { operation: string; input: any }[] = [];
	await open(page, ["ADMIN", "CONSORTIUM_ADMIN"], sent);
	const main = page.getByRole("main");

	await expect(
		main.getByRole("combobox", { name: /associated agency/i }),
	).toHaveAttribute("readonly");
	// A select or free text, depending on the Host LMS type
	await expect(main.getByLabel(/authentication profile/i)).toBeDisabled();

	await main.getByLabel("Full name").fill(`${LIBRARY.fullName} renamed`);
	await main
		.getByRole("switch", { name: /borrowing/i })
		.or(main.getByRole("checkbox", { name: /borrowing/i }))
		.click();
	await main.getByRole("button", { name: /continue/i }).click();

	await expect
		.poll(() => sent.map((s) => s.operation))
		.toEqual(["library", "agency"]);
	expect(sent[1].input.code).toBe(LIBRARY.agencyCode);
});

// updateAgency admits only CONSORTIUM_ADMIN on 8.71.0-9.3.0, and support staff may hold ADMIN alone
test("an administrator without CONSORTIUM_ADMIN saves the library and is not offered the agency's fields", async ({
	page,
}) => {
	const sent: { operation: string; input: any }[] = [];
	await open(page, ["ADMIN"], sent);
	const main = page.getByRole("main");

	await expect(
		main.getByText(/only a consortium administrator can change them/i),
	).toBeVisible();
	await expect(
		main.getByLabel(/maximum active requests per patron/i),
	).toBeDisabled();

	await main.getByLabel("Full name").fill(`${LIBRARY.fullName} renamed`);
	await main.getByRole("button", { name: /continue/i }).click();

	await expect.poll(() => sent.map((s) => s.operation)).toEqual(["library"]);
});

test("an unchanged agency is not written when only the library changed", async ({
	page,
}) => {
	const sent: { operation: string; input: any }[] = [];
	await open(page, ["ADMIN", "CONSORTIUM_ADMIN"], sent);
	const main = page.getByRole("main");

	await main.getByLabel("Full name").fill(`${LIBRARY.fullName} renamed`);
	await main.getByRole("button", { name: /continue/i }).click();

	await expect.poll(() => sent.map((s) => s.operation)).toEqual(["library"]);
});

test("the library's settings are not offered for editing to an administrator without CONSORTIUM_ADMIN", async ({
	page,
}) => {
	await seedAuth(page, { roles: ["ADMIN"] });
	await mockGraphQL(page, {
		LoadConsortiumHeader: consortiumBasics,
		LoadLibrary: libraryDetail,
		LoadLibraryBasics: libraryDetail,
		LoadMappings: { referenceValueMappings: { totalSize: 0, content: [] } },
		LoadLocations: { locations: { totalSize: 0, content: [] } },
		LoadResolvedFunctionalSettings: resolvedSettings,
		LoadSettingsBearingGroupType: { settingsBearingGroupType: null },
	});
	await page.goto(`/libraries/${LIBRARY.id}/settings`);
	await expect(
		page.getByRole("heading", { name: LIBRARY.fullName }),
	).toBeVisible();

	await page.getByRole("button", { name: "Actions" }).click();

	await expect(page.getByRole("menuitem", { name: "Edit" })).toBeDisabled();
});
