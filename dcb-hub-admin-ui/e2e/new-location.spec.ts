import { test, expect, type Locator, type Page } from "@playwright/test";

import { ADMIN_ROLES, seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import libraries from "./fixtures-data/libraries.json";
import locations from "./fixtures-data/locations.json";

/**
 * Creating a location from the consortium-wide locations page.
 *
 * That page used to open the dialog with `hostLmsCode`, `agencyCode` and `ils` all
 * empty and submit them verbatim; both codes are `String!`, so "" passed GraphQL
 * validation and then named an agency the server cannot resolve.
 *
 * What is asserted is the REQUEST, not that a picker exists: whatever the user chose,
 * CreateLocation must carry a real agency and Host LMS code. By role and accessible
 * name throughout, so it is an accessibility check too.
 */

const ALPHA = libraries.libraries.content[0];
const BETA = libraries.libraries.content[1];

/** Beta, running a second Host LMS: the only case that needs a question asked. */
const TWO_HOST_LMS = {
	libraries: {
		...libraries.libraries,
		content: [
			ALPHA,
			{
				...BETA,
				secondHostLms: {
					id: "h2h2h2h2-2222-5222-9222-222222222222",
					code: "beta-lms-two",
					clientConfig: null,
					lmsClientClass: null,
				},
			},
		],
	},
};

const baseMocks = (librariesPayload: unknown) => ({
	LoadConsortiumHeader: consortiumBasics,
	LoadLocations: locations,
	LoadLibraries: librariesPayload,
});

/**
 * The variables of every CreateLocation the page sends.
 *
 * Registered through mockGraphQL's function form rather than a second `page.route`:
 * two handlers over `**\/graphql` chain in reverse registration order, and a fallback
 * from the outer one reaches a `route.continue` with no server behind it.
 */
const captureCreateLocation = async (
	page: Page,
	librariesPayload: unknown = libraries,
) => {
	const seen: { input?: Record<string, unknown> }[] = [];

	await mockGraphQL(page, {
		...baseMocks(librariesPayload),
		CreateLocation: (variables: any) => {
			seen.push(variables);
			return { createLocation: { id: "new-location-id", name: "New Desk" } };
		},
	});

	return seen;
};

const openDialog = async (page: Page) => {
	await page.goto("/locations");
	await page.getByRole("button", { name: "New location" }).click();
	return page.getByRole("dialog");
};

/** Everything `CreateLocationInput` requires, apart from the scope under test. */
const fillLocationFields = async (dialog: Locator) => {
	await dialog.getByRole("textbox", { name: "Location name" }).fill("New Desk");
	await dialog.getByRole("textbox", { name: "Location code" }).fill("NEW-DESK");
	await dialog.getByRole("spinbutton", { name: "Longitude" }).fill("-2.2426");
	await dialog.getByRole("spinbutton", { name: "Latitude" }).fill("53.4808");
};

test.beforeEach(async ({ page }) => {
	await seedAuth(page, { roles: ADMIN_ROLES });
});

test.describe("New location from the consortium-wide locations page", () => {
	test("asks which library, and will not submit until it knows", async ({
		page,
	}) => {
		await mockGraphQL(page, baseMocks(libraries));
		const dialog = await openDialog(page);

		const create = dialog.getByRole("button", { name: "New location" });
		await fillLocationFields(dialog);

		// Every location field is filled and valid; the only thing missing is the
		// scope. Before the fix this was the state in which the button submitted
		// agencyCode: "" and the create failed server-side.
		await expect(create).toBeDisabled();

		await dialog.getByRole("combobox", { name: "Library" }).click();
		await page.getByRole("option", { name: "Alpha Test Library" }).click();

		await expect(create).toBeEnabled();
	});

	test("derives the agency and Host LMS from the chosen library", async ({
		page,
	}) => {
		const requests = await captureCreateLocation(page);
		const dialog = await openDialog(page);

		await dialog.getByRole("combobox", { name: "Library" }).click();
		await page.getByRole("option", { name: "Beta Test Library" }).click();
		await fillLocationFields(dialog);

		await dialog.getByRole("button", { name: "New location" }).click();

		await expect.poll(() => requests.length).toBe(1);
		expect(requests[0].input).toMatchObject({
			name: "New Desk",
			code: "NEW-DESK",
			agencyCode: BETA.agencyCode,
			hostLmsCode: BETA.agency.hostLms.code,
		});
	});

	test("does not ask about the Host LMS when the library runs one", async ({
		page,
	}) => {
		await mockGraphQL(page, baseMocks(libraries));
		const dialog = await openDialog(page);

		await dialog.getByRole("combobox", { name: "Library" }).click();
		await page.getByRole("option", { name: "Alpha Test Library" }).click();

		// One choice is not a question. Asking anyway is a required field the user
		// cannot get wrong, which is just an extra click on every location.
		await expect(
			dialog.getByRole("combobox", { name: "Host LMS" }),
		).toBeHidden();
	});

	test("asks which Host LMS when the library runs two, and sends that one", async ({
		page,
	}) => {
		const requests = await captureCreateLocation(page, TWO_HOST_LMS);
		const dialog = await openDialog(page);

		await dialog.getByRole("combobox", { name: "Library" }).click();
		await page.getByRole("option", { name: "Beta Test Library" }).click();

		const hostLms = dialog.getByRole("combobox", { name: "Host LMS" });
		await expect(hostLms).toBeVisible();

		// Until it is answered there is no Host LMS code to send, so the scope is
		// still incomplete.
		await fillLocationFields(dialog);
		await expect(
			dialog.getByRole("button", { name: "New location" }),
		).toBeDisabled();

		await hostLms.click();
		await page.getByRole("option", { name: /beta-lms-two/ }).click();

		await dialog.getByRole("button", { name: "New location" }).click();

		await expect.poll(() => requests.length).toBe(1);
		expect(requests[0].input).toMatchObject({
			agencyCode: BETA.agencyCode,
			hostLmsCode: "beta-lms-two",
		});
	});
});

test.describe("New location from a library's own Locations tab", () => {
	test("does not ask, because the caller already knows", async ({ page }) => {
		await mockGraphQL(page, {
			LoadConsortiumHeader: consortiumBasics,
			LoadLibrary: { libraries: { content: [ALPHA] } },
			LoadLocations: locations,
		});

		await page.goto(`/libraries/${ALPHA.id}/locations`);
		await page.getByRole("button", { name: "New location" }).first().click();

		const dialog = page.getByRole("dialog");
		await expect(dialog).toBeVisible();

		// Asking here would let an administrator file a location under a library whose
		// page they are not on.
		await expect(
			dialog.getByRole("combobox", { name: "Library" }),
		).toBeHidden();
		await expect(
			dialog.getByRole("heading", { name: /Alpha Test Library/ }),
		).toBeVisible();
	});
});
