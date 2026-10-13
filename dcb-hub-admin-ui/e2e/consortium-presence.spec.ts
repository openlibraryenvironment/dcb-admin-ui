import { type Page } from "@playwright/test";
import { expect, test } from "./fixtures/test";

import { ADMIN_ROLES, seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import consortium from "./fixtures-data/consortium.json";

/** Edit lives behind the page's Actions menu, not beside the heading. */
async function startEditing(page: Page) {
	await page.getByRole("button", { name: "Actions" }).click();
	await page.getByRole("menuitem", { name: "Edit" }).click();
}

/**
 * The consortium's half of the discovery footer's website and support links. Two rules:
 *
 *  - The field is behind its OWN flag, not the branding one: `support_url` is in no
 *    dcb-service release yet, and selecting it on 9.0.0 fails LoadConsortium whole.
 *  - dcb-service refuses a URL that is not absolute http(s), so a bad value is reported
 *    under the box rather than as an unattributed 400.
 *
 * schemaConformance.test.ts gates the document shape; this proves the field renders, is
 * reachable and named, and refuses what the server refuses.
 */

const MOCKS = {
	LoadConsortiumHeader: consortiumBasics,
	LoadConsortium: consortium,
};

test.describe("the consortium's presence links", () => {
	test.beforeEach(async ({ page }) => {
		await useAllFeatures(page);
		await seedAuth(page, { roles: ADMIN_ROLES });
		await mockGraphQL(page, MOCKS);
	});

	test("both links are shown, and they are different destinations", async ({
		page,
	}) => {
		await page.goto("/consortium");

		await expect(
			page.getByText("https://consortium.example.invalid", { exact: true }),
		).toBeVisible();
		await expect(
			page.getByText("https://consortium.example.invalid/report-a-problem"),
		).toBeVisible();
	});

	test("the support field has an accessible name, not just a heading above it", async ({
		page,
	}) => {
		// A TextField with neither `label` nor `aria-labelledby` has no accessible name
		// at all: a screen-reader user meets a box called "edit text". The visible
		// heading is linked to the input rather than merely sitting above it.
		await page.goto("/consortium");
		await startEditing(page);

		await expect(
			page.getByRole("textbox", { name: "Patron support URL" }),
		).toHaveValue("https://consortium.example.invalid/report-a-problem");
	});

	test("refuses at the field what dcb-service refuses on write", async ({
		page,
	}) => {
		// Without this the administrator meets a 400 with no field attached, and the
		// whole argument for validating on the server is undone by not saying which box
		// was wrong.
		await page.goto("/consortium");
		await startEditing(page);

		const support = page.getByRole("textbox", { name: "Patron support URL" });
		await support.fill("javascript:alert(1)");
		await support.blur();

		await expect(
			page.getByText(/full web address starting with https:\/\//),
		).toBeVisible();
	});
});
