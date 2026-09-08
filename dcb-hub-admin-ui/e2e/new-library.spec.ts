import { test, expect, Page } from "@playwright/test";
import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import libraries from "./fixtures-data/libraries.json";

// Scope note: the New Library wizard is a large multi-step flow (host LMS,
// profile, contacts, group, mappings, locations) backed by several
// mutations. Rather than drive every step (brittle, and re-implements the
// whole component's logic in test form), this covers the parts most
// valuable to regression-test: the modal opens, and client-side validation
// (the zod newLibrarySchema, via src/forms/NewLibrary/NewLibrary.tsx's
// handleNext -> methods.trigger()) actually blocks progression on invalid input.

// Opening the wizard: page actions are gated behind an "Actions" dropdown
// (PageActionsMenu), not a directly-visible button. The first step is a radio
// group ("Use existing system" / "Create new system") plus a Continue button -
// NOT a pair of buttons, which is what these specs used to click and why they
// timed out waiting for a "Create new" button that has never existed.
// Cancelling raises a second dialog, so `getByRole("dialog")` stops being unique the
// moment the confirmation is up. Name the one we mean.
const wizard = (page: Page) =>
	page
		.getByRole("dialog")
		.filter({ hasNot: page.getByText(/unsaved changes/i) });

const openWizardOnHostLmsStep = async (page: Page) => {
	await page.getByRole("button", { name: /actions/i }).click();
	await page.getByRole("menuitem", { name: /create a new library/i }).click();
	await page.getByRole("radio", { name: /create new system/i }).check();
	await page.getByRole("button", { name: /continue/i }).click();
};

test.describe("New Library wizard", () => {
	test.beforeEach(async ({ page }) => {
		await seedAuth(page);
		await mockGraphQL(page, {
			LoadConsortiumHeader: consortiumBasics,
			LoadLibraries: libraries,
		});
		await page.goto("/libraries");
		await expect(page.getByText("Alpha Test Library")).toBeVisible();
	});

	test("opens to the new-vs-existing mode selection step", async ({ page }) => {
		await page.getByRole("button", { name: /actions/i }).click();
		await page.getByRole("menuitem", { name: /create a new library/i }).click();

		await expect(wizard(page)).toBeVisible();
		await expect(
			page.getByRole("radio", { name: /create new system/i }),
		).toBeVisible();
		await expect(
			page.getByRole("radio", { name: /use existing system/i }),
		).toBeVisible();
	});

	test("blocks advancing past the host LMS step with empty required fields, with visible validation feedback", async ({
		page,
	}) => {
		await openWizardOnHostLmsStep(page);

		const dialog = wizard(page);
		const codeField = dialog.getByLabel(/host lms code/i);
		await expect(codeField).toBeVisible();

		await dialog.getByRole("button", { name: /next/i }).click();

		// Still on the same step, no CreateHostLms mutation was attempted, and
		// the field is now flagged as invalid with visible helper text -
		// regression test for a bug where handleNext's methods.trigger()
		// validated the ENTIRE multi-step schema (including a later step's
		// always-empty `contacts` field) instead of just this step's fields,
		// so validation silently blocked every step forever with no feedback.
		await expect(codeField).toHaveValue("");
		await expect(codeField).toHaveAttribute("aria-invalid", "true");
		// The message comes from newLibrarySchema -> i18n "ui.validation.required"
		// ("Enter the {{field}}."), not the invented wording this spec used to
		// assert.
		await expect(dialog.getByText("Enter the Host LMS code.")).toBeVisible();
	});

	// The step after Host LMS is Verification (it pings the newly created Host
	// LMS), not Profile - Profile comes after that.
	test("advances past the host LMS step once its fields are valid", async ({
		page,
	}) => {
		await mockGraphQL(page, {
			LoadConsortiumHeader: consortiumBasics,
			LoadLibraries: libraries,
			CreateHostLms: {
				createHostLms: { hostLms: { code: "testcode" }, pingStatus: "OK" },
			},
		});
		await openWizardOnHostLmsStep(page);

		const dialog = wizard(page);
		await dialog.getByLabel(/host lms code/i).fill("testcode");
		await dialog.getByLabel(/host lms name/i).fill("Test LMS");
		// "LMS type" (hostlms.type), not "client class". The picker is labelled for
		// the librarian choosing Sierra or FOLIO; lmsClientClass is the field name
		// behind it, and asserting on that was asserting on the implementation.
		await dialog.getByLabel(/lms type/i).click();
		await page.getByRole("option", { name: "Sierra" }).click();

		// Choosing a type reveals that type's client configuration, and the five
		// fields Sierra marks required are validated by this step too
		// (STEP_SCHEMA_FIELDS.hostLms includes clientConfigFields). Leaving them
		// empty is why this step does not advance - which is the form working.
		// By role, not by label: a secret field ships a "Show <label>" toggle whose
		// aria-label contains the field's own, so getByLabel matches the button too.
		const configField = (name: RegExp) => dialog.getByRole("textbox", { name });

		await configField(/base url/i).fill("https://sierra.example.org");
		await configField(/sierra api key/i).fill("test-key");
		await configField(/sierra api secret/i).fill("test-secret");
		await configField(/default agency code/i).fill("TESTAGENCY");
		await configField(/page size/i).fill("100");

		await dialog.getByRole("button", { name: /next/i }).click();

		await expect(dialog.locator(".MuiStepLabel-label.Mui-active")).toHaveText(
			"Verification",
		);
	});

	// Cancelling part-way through does NOT discard silently: requestClose() in
	// NewLibrary.tsx asks first, because everything typed since the last successful
	// mutation is lost on close and the whole point of this wizard is that it is long.
	// The two tests below pin both halves of that - the ask, and the way out of it.
	test("cancel asks before discarding, and keeping the wizard open leaves it open", async ({
		page,
	}) => {
		await openWizardOnHostLmsStep(page);

		await wizard(page)
			.getByRole("button", { name: /cancel/i })
			.click();

		const confirmation = page.getByRole("dialog", {
			name: /you have unsaved changes/i,
		});
		await expect(confirmation).toBeVisible();

		await confirmation.getByRole("button", { name: /keep editing/i }).click();

		await expect(confirmation).not.toBeVisible();
		await expect(wizard(page)).toBeVisible();
	});

	test("confirming the discard closes the wizard", async ({ page }) => {
		await openWizardOnHostLmsStep(page);

		await wizard(page)
			.getByRole("button", { name: /cancel/i })
			.click();
		await page
			.getByRole("dialog", { name: /you have unsaved changes/i })
			.getByRole("button", { name: /leave without saving/i })
			.click();

		await expect(wizard(page)).not.toBeVisible();
	});

	// The other half of the same rule: with genuinely nothing to lose there is no
	// prompt, so a mistaken click is one Cancel rather than two.
	test("cancel on the untouched first step closes without asking", async ({
		page,
	}) => {
		await page.getByRole("button", { name: /actions/i }).click();
		await page.getByRole("menuitem", { name: /create a new library/i }).click();
		await expect(wizard(page)).toBeVisible();

		await wizard(page)
			.getByRole("button", { name: /cancel/i })
			.click();

		await expect(wizard(page)).not.toBeVisible();
		await expect(
			page.getByRole("dialog", { name: /you have unsaved changes/i }),
		).not.toBeVisible();
	});
});
