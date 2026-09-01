import { test, expect } from "@playwright/test";

import { scanForViolations } from "./fixtures/axe";
import { seedAuth, READ_ONLY_ROLES } from "./fixtures/auth";
import { seedTheme } from "./fixtures/theme";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import consortium from "./fixtures-data/consortium.json";
import libraries from "./fixtures-data/libraries.json";
import libraryCount from "./fixtures-data/library-count.json";

/**
 * The setup flow's own gate — W-13 / W-14.
 *
 * Two halves, and both are the point:
 *
 *  - **Axe, on every chapter, in three colour schemes.** Automated rules catch about a
 *    third of WCAG failures.
 *  - **The other two thirds, asserted by hand.** Focus moving to the heading on
 *    navigation, the step being announced, the rail being links, the URL being state and
 *    the guard being real. None of those are things axe can see, and every one of them is
 *    a way this class of feature usually fails.
 */

const MOCKS = {
	LoadConsortiumHeader: consortiumBasics,
	LoadConsortium: consortium,
	LoadLibraries: libraries,
	LoadLibraryCount: libraryCount,
};

const CHAPTERS = [
	"appearance",
	"consortium",
	"howItWorks",
	"contacts",
	"discovery",
	"libraries",
] as const;

for (const scheme of ["light", "dark"] as const) {
	test.describe(`Setup - WCAG 2.2 AA - ${scheme} mode`, () => {
		test.use({ colorScheme: scheme });

		test.beforeEach(async ({ page }) => {
			await seedAuth(page);
			await mockGraphQL(page, MOCKS);
		});

		for (const chapter of CHAPTERS) {
			test(`${chapter} has no violations`, async ({ page }) => {
				await page.goto(`/setup/${chapter}`);
				await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
				await scanForViolations(page);
			});
		}

		test("the finish screen has no violations", async ({ page }) => {
			await page.goto("/setup/done");
			await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
			await scanForViolations(page);
		});
	});
}

test.describe("Setup - WCAG 2.2 AA - high contrast", () => {
	test.beforeEach(async ({ page }) => {
		await seedAuth(page);
		await seedTheme(page, { mode: "highContrast" });
		await mockGraphQL(page, MOCKS);
	});

	for (const chapter of CHAPTERS) {
		test(`${chapter} has no violations`, async ({ page }) => {
			await page.goto(`/setup/${chapter}`);
			await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
			await scanForViolations(page);
		});
	}
});

test.describe("Setup - structure and behaviour", () => {
	test.beforeEach(async ({ page }) => {
		await seedAuth(page);
		await mockGraphQL(page, MOCKS);
	});

	test("is exactly one h1, and it is the question being asked", async ({
		page,
	}) => {
		await page.goto("/setup/appearance");

		await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
		await expect(page.getByRole("heading", { level: 1 })).toContainText(
			/how should dcb admin look/i,
		);
	});

	test("the progress rail is a named navigation of real links", async ({
		page,
	}) => {
		await page.goto("/setup/consortium");

		const rail = page.getByRole("navigation", { name: /setup progress/i });
		await expect(rail).toBeVisible();

		// Links, not buttons: openable in a new tab, announced as links, and present
		// in a screen reader's link list. A Stepper would give none of that.
		await expect(
			rail.getByRole("link", { name: /your consortium/i }),
		).toBeVisible();

		// The chapter being shown is marked, not just coloured. See SetupRail for why
		// this is "page" and not the more precise "step".
		await expect(
			rail.getByRole("link", { name: /your consortium/i }),
		).toHaveAttribute("aria-current", "page");

		// And only that one. Two current items is the same as none.
		await expect(rail.locator("[aria-current]")).toHaveCount(1);
	});

	test("offers a way out of the flow", async ({ page }) => {
		// Setup is not one sitting and it is not compulsory. A flow whose only exit is the
		// browser's back button reads as a trap, and the banner on the home page is what
		// brings people back to whichever chapter they left.
		await page.goto("/setup/consortium");

		const exit = page.getByRole("link", { name: /finish later/i });
		await expect(exit).toBeVisible();

		await exit.click();
		await expect(page).toHaveURL(/\/$|\/#/);
	});

	test("warns before throwing away unsaved edits", async ({ page }) => {
		// The CONTACTS chapter, not the consortium one: these mocks return an existing
		// consortium, so that chapter renders its "already set up" state and has no
		// editable field to dirty. Contacts always offers one.
		await page.goto("/setup/contacts");

		// Nothing typed yet: leaving is free. A guard that fires on a pristine form is one
		// everybody learns to dismiss without reading.
		await page.getByRole("link", { name: /finish later/i }).click();
		await expect(page).toHaveURL(/\/$/);

		await page.goto("/setup/contacts");
		await page
			.getByRole("textbox", { name: /first name/i })
			.fill("Half-typed");

		// Now the same navigation has something to lose.
		await page.getByRole("link", { name: /finish later/i }).click();

		const dialog = page.getByRole("dialog");
		await expect(dialog).toBeVisible();
		await expect(dialog).toContainText(/without saving/i);

		// Staying keeps both the chapter AND what was typed - a guard that discards the
		// work it just protected is worse than none.
		await dialog.getByRole("button", { name: /stay on this chapter/i }).click();
		await expect(page).toHaveURL(/\/setup\/contacts/);
		await expect(
			page.getByRole("textbox", { name: /first name/i }),
		).toHaveValue("Half-typed");

		// And leaving deliberately still works.
		await page.getByRole("link", { name: /finish later/i }).click();
		await page
			.getByRole("dialog")
			.getByRole("button", { name: /leave and discard/i })
			.click();
		await expect(page).toHaveURL(/\/$/);
	});

	test("moves focus to the heading when the chapter changes", async ({
		page,
	}) => {
		// Without this a keyboard user presses Continue and is still standing on a
		// button that no longer exists, above content they cannot see.
		await page.goto("/setup/appearance");
		await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

		await page
			.getByRole("navigation", { name: /setup progress/i })
			.getByRole("link", { name: /discovery branding/i })
			.click();

		await expect(page).toHaveURL(/\/setup\/discovery$/);
		const focused = page.locator(":focus");
		await expect(focused).toHaveRole("heading");
	});

	test("announces which step the user is now on", async ({ page }) => {
		await page.goto("/setup/contacts");

		// "Step 4 of 6" exists only as a position in the rail, i.e. only visually.
		await expect(page.getByText(/step 4 of 6/i).first()).toBeAttached();
	});

	test("the URL is the state: a chapter survives a reload", async ({
		page,
	}) => {
		// "discovery", not "Symposia": the product name is not necessarily what a
		// consortium calls the thing its patrons search, and this chapter is where
		// they brand it themselves.
		await page.goto("/setup/discovery");
		await expect(page.getByRole("heading", { level: 1 })).toContainText(
			/discovery/i,
		);

		await page.reload();
		await expect(page.getByRole("heading", { level: 1 })).toContainText(
			/discovery/i,
		);
	});

	test("a hand-typed chapter that does not exist goes to the start", async ({
		page,
	}) => {
		await page.goto("/setup/nonsense");

		await expect(page).toHaveURL(/\/setup\/appearance$/);
	});

	test("/setup resolves to the first chapter still outstanding", async ({
		page,
	}) => {
		// The fixture consortium has contacts, functional settings and libraries but NO
		// patron-facing brand, so discovery is what is genuinely left.
		//
		// This used to assert appearance, and it passed for the wrong reason: appearance
		// counted as outstanding until the browser recorded having seen it, so it always
		// sorted first. It is optional now - it writes nothing, so there is nothing to
		// finish - and the first OUTSTANDING chapter is the one with real work in it.
		//
		// Resolved in beforeLoad, so there is no flash of the wrong chapter on the way.
		await page.goto("/setup");

		await expect(page).toHaveURL(/\/setup\/discovery$/);
	});

	test("Setup is reachable as a tab under Consortium", async ({ page }) => {
		await page.goto("/consortium");

		await page.getByRole("tab", { name: /^setup$/i }).click();

		await expect(page).toHaveURL(/\/setup\//);
		await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
	});

	test("the typeface picker offers a choice and applies it", async ({
		page,
	}) => {
		await page.goto("/setup/appearance");

		const picker = page.getByRole("radiogroup", { name: /reading typeface/i });
		await expect(picker).toBeVisible();

		await picker.getByRole("radio", { name: /lexend/i }).check();

		// The choice reaches the theme, not just the store.
		await expect
			.poll(async () =>
				page.evaluate(() => getComputedStyle(document.body).fontFamily),
			)
			.toMatch(/lexend/i);
	});

	test("the typeface survives a reload", async ({ page }) => {
		await page.goto("/setup/appearance");
		await page
			.getByRole("radiogroup", { name: /reading typeface/i })
			.getByRole("radio", { name: /atkinson/i })
			.check();

		await page.reload();

		await expect(
			page
				.getByRole("radiogroup", { name: /reading typeface/i })
				.getByRole("radio", { name: /atkinson/i }),
		).toBeChecked();
	});
});

test.describe("Setup - authorisation", () => {
	test("a non-administrator is never shown a setup chapter", async ({
		page,
	}) => {
		// Hiding a nav entry is UX. This is the check that stops a read-only user
		// being handed a form whose every save would be refused.
		//
		// The assertion is on the CONTENT, not the URL: on a cold load
		// react-oidc-context has not resolved the session by the time beforeLoad runs,
		// so the redirect cannot fire and the component refuses instead. That is the
		// case this test exists for - it caught the guard silently passing.
		await seedAuth(page, { roles: READ_ONLY_ROLES });
		await mockGraphQL(page, MOCKS);

		await page.goto("/setup/consortium");

		await expect(
			page.getByRole("heading", { name: /unauthorised|not authorised/i }),
		).toBeVisible();
		await expect(
			page.getByRole("textbox", { name: /consortium name/i }),
		).toHaveCount(0);
	});
});
