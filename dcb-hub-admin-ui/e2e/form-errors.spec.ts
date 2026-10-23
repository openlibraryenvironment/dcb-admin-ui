import { type Locator, type Page } from "@playwright/test";
import { test, expect } from "./fixtures/test";

import { seedAuth, ADMIN_ROLES } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import { MOCKS } from "./fixtures/routes";
import { expectPaintedScheme, scanForViolations } from "./fixtures/axe";
import { covers } from "./fixtures/coverage";

/**
 * A validation error is announced, not just coloured - W-11.
 *
 * accessibility.spec.ts scans both of these forms, but it scans them PRISTINE: it presses
 * Edit and runs axe over a form with nothing wrong. No axe rule can see error
 * association, and no spec in this directory asserted `aria-describedby` at all.
 *
 * Doctrine: aria-invalid="true" plus aria-describedby referencing the error node, and
 * colour is never the only signal. Argument and method: docs/accessibility.md.
 */

const LIBRARY_ID = "c23df3ab-77c0-5689-b56d-fc8a2d6a5f22";

/**
 * The error text is reachable from the field itself.
 *
 * `aria-describedby` may name several ids, so every one is resolved and their text
 * joined - which is what a screen reader does. Asserting on the message rather than on
 * the attribute's presence: an id pointing at a node that does not exist, or at the help
 * text while the error renders somewhere else, satisfies the attribute and tells the user
 * nothing.
 */
async function expectErrorAnnounced(
	page: Page,
	field: Locator,
	message: RegExp,
) {
	await expect(field).toHaveAttribute("aria-invalid", "true");

	const describedBy = await field.getAttribute("aria-describedby");
	expect(describedBy, "the field names no description").toBeTruthy();

	const described = await page.evaluate(
		(ids) =>
			(ids ?? "")
				.split(/\s+/)
				.filter(Boolean)
				.map((id) => document.getElementById(id)?.textContent ?? "")
				.join(" "),
		describedBy,
	);

	expect(described, "aria-describedby does not reach the error text").toMatch(
		message,
	);
}

// useAllFeatures is named like a hook, so rules-of-hooks rejects a call from a named
// helper. Playwright callbacks are fine - the pattern every spec in this directory uses.
test.beforeEach(async ({ page }) => {
	await useAllFeatures(page);
	await seedAuth(page, { roles: ADMIN_ROLES });
	await mockGraphQL(page, MOCKS);
});

async function arrive(page: Page, path: string) {
	await page.goto(path);
}

test.describe("the library branding form", () => {
	const PATH = `/libraries/${LIBRARY_ID}/branding`;

	async function edit(page: Page) {
		await arrive(page, PATH);
		await page.getByRole("button", { name: "Actions" }).click();
		await page.getByRole("menuitem", { name: "Edit" }).click();
		await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
	}

	test(
		"a rejected logo URL is announced on the field",
		covers("A rejected logo address is identified on its field, in text.", [
			"3.3.1",
		]),
		async ({ page }) => {
			await edit(page);

			const logoUrl = page.getByRole("textbox", { name: /logo url/i });
			await logoUrl.fill("not a url at all");
			await logoUrl.blur();

			await expectErrorAnnounced(page, logoUrl, /web address|upload an image/i);
		},
	);

	for (const scheme of ["light", "dark"] as const) {
		test.describe(`showing an error, ${scheme}`, () => {
			test.use({ colorScheme: scheme });

			test(
				"has no accessibility violations",
				covers(
					`Every check axe can automate passes on the library branding form showing an error, in ${scheme} mode.`,
					[],
					{ page: "library branding form, with an error", view: scheme },
				),
				async ({ page }) => {
					await edit(page);

					const logoUrl = page.getByRole("textbox", { name: /logo url/i });
					await logoUrl.fill("not a url at all");
					await logoUrl.blur();
					// The error has to be on screen, or this is the pristine scan again.
					await expect(logoUrl).toHaveAttribute("aria-invalid", "true");

					await expectPaintedScheme(page, scheme);
					await scanForViolations(page);
				},
			);
		});
	}
});

test.describe("the new Host LMS form", () => {
	const PATH = "/hostlmss/new";

	test(
		"a missing code is announced on the field",
		covers("A missing Host LMS code is identified on its field, in text.", [
			"3.3.1",
		]),
		async ({ page }) => {
			await arrive(page, PATH);
			await expect(page.getByLabel(/^library/i)).toBeVisible();

			// Touch and clear the required field, which is how a user meets this error.
			const code = page.getByRole("textbox", { name: /host lms code/i });
			await code.fill("x");
			await code.fill("");
			await code.blur();

			await expectErrorAnnounced(page, code, /required|enter/i);
		},
	);

	for (const scheme of ["light", "dark"] as const) {
		test.describe(`showing an error, ${scheme}`, () => {
			test.use({ colorScheme: scheme });

			test(
				"has no accessibility violations",
				covers(
					`Every check axe can automate passes on the new Host LMS form showing an error, in ${scheme} mode.`,
					[],
					{ page: "new Host LMS form, with an error", view: scheme },
				),
				async ({ page }) => {
					await arrive(page, PATH);
					await expect(page.getByLabel(/^library/i)).toBeVisible();

					const code = page.getByRole("textbox", { name: /host lms code/i });
					await code.fill("x");
					await code.fill("");
					await code.blur();
					await expect(code).toHaveAttribute("aria-invalid", "true");

					await expectPaintedScheme(page, scheme);
					await scanForViolations(page);
				},
			);
		});
	}
});
