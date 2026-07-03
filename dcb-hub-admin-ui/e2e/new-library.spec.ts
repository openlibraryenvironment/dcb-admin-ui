import { test, expect } from "@playwright/test";
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
		// Page actions are gated behind an "Actions" dropdown (PageActionsMenu),
		// not a directly-visible button.
		await page.getByRole("button", { name: /actions/i }).click();
		await page.getByRole("menuitem", { name: /create a new library/i }).click();

		await expect(page.getByRole("dialog")).toBeVisible();
		await expect(
			page.getByRole("button", { name: /create new/i }),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: /use existing/i }),
		).toBeVisible();
	});

	test("blocks advancing past the host LMS step with empty required fields, with visible validation feedback", async ({
		page,
	}) => {
		// Page actions are gated behind an "Actions" dropdown (PageActionsMenu),
		// not a directly-visible button.
		await page.getByRole("button", { name: /actions/i }).click();
		await page.getByRole("menuitem", { name: /create a new library/i }).click();
		await page.getByRole("button", { name: /create new/i }).click();

		const dialog = page.getByRole("dialog");
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
		await expect(dialog.getByText("Host LMS Code is required")).toBeVisible();
	});

	test("advances to the Profile step once host LMS fields are valid", async ({
		page,
	}) => {
		await mockGraphQL(page, {
			LoadConsortiumHeader: consortiumBasics,
			LoadLibraries: libraries,
			CreateHostLms: {
				createHostLms: { hostLms: { code: "testcode" }, pingStatus: "OK" },
			},
		});
		await page.getByRole("button", { name: /actions/i }).click();
		await page.getByRole("menuitem", { name: /create a new library/i }).click();
		await page.getByRole("button", { name: /create new/i }).click();

		const dialog = page.getByRole("dialog");
		await dialog.getByLabel(/host lms code/i).fill("testcode");
		await dialog.getByLabel(/host lms name/i).fill("Test LMS");
		await dialog.getByLabel(/client class/i).click();
		await page.getByRole("option", { name: "Sierra" }).click();

		await dialog.getByRole("button", { name: /next/i }).click();

		await expect(dialog.locator(".MuiStepLabel-label.Mui-active")).toHaveText(
			"Profile",
		);
	});

	test("cancel closes the dialog without submitting", async ({ page }) => {
		// Page actions are gated behind an "Actions" dropdown (PageActionsMenu),
		// not a directly-visible button.
		await page.getByRole("button", { name: /actions/i }).click();
		await page.getByRole("menuitem", { name: /create a new library/i }).click();
		await page.getByRole("button", { name: /create new/i }).click();

		const dialog = page.getByRole("dialog");
		await dialog.getByRole("button", { name: /cancel/i }).click();

		await expect(dialog).not.toBeVisible();
	});
});
