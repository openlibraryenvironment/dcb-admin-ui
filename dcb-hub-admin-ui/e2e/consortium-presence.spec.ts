import { expect, test, type Page } from "@playwright/test";

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
 * Administering the consortium's presence links — §V-11.1.
 *
 * The discovery app's footer renders a website and a support link for each level of the
 * brand chain (§V-11.2). This is where the consortium's half is typed in, and the field
 * carries two rules that are easy to get wrong in opposite directions:
 *
 *  - It is behind its OWN flag, not the branding one. `support_url` arrived in V9_0_008,
 *    after the 9.0.0 tag; the brand columns arrived in it. Selecting it on a 9.0.0
 *    deployment fails LoadConsortium whole.
 *  - dcb-service now refuses a URL that is not absolute http(s) on write, so a bad value
 *    has to be reported under the box rather than as an unattributed 400.
 *
 * The document shape is gated in schemaConformance.test.ts. What is only provable here is
 * that the field renders, is reachable and named, and refuses what the server refuses.
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
