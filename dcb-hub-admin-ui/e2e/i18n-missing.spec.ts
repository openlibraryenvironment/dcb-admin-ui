import { test, expect } from "@playwright/test";

import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import { MOCKS, ROUTES } from "./fixtures/routes";

/**
 * Keys i18next could not resolve, on every route the axe gate scans.
 *
 * A key the catalogue does not carry renders as the key itself - a user sees
 * `libraries.accounts.email` where a label should be. Why this is a runtime gate
 * and not a static scan: docs/i18n.md.
 */

/** What `recordMissingKey` leaves on the page. */
const missingKeys = (page: import("@playwright/test").Page) =>
	page.evaluate(() => window.__I18N_MISSING__ ?? []);

test.describe("no route renders a missing translation key", () => {
	test.beforeEach(async ({ page }) => {
		// The widest surface: a key reached only behind a flag is a key this gate
		// would otherwise never ask for.
		await useAllFeatures(page);
		await seedAuth(page);
		await mockGraphQL(page, MOCKS);
	});

	test("the collector is armed, so a pass means something", async ({
		page,
	}) => {
		// The array is created at boot when VITE_I18N_REPORT_MISSING is set, so its
		// presence proves the switch reached this build. Without this check the suite
		// below would pass identically on a build that records nothing.
		await page.goto("/");
		await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

		const armed = await page.evaluate(() =>
			Array.isArray(window.__I18N_MISSING__),
		);

		expect(
			armed,
			"VITE_I18N_REPORT_MISSING=true did not reach this build, so this gate measures nothing. See docs/i18n.md.",
		).toBe(true);
	});

	for (const route of ROUTES) {
		test(`${route.path} resolves every key it renders`, async ({ page }) => {
			await route.setup?.(page);
			await page.goto(route.path);
			await route.ready(page);

			expect(await missingKeys(page)).toEqual([]);
		});
	}
});
