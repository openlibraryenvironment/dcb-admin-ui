import { type Page } from "@playwright/test";
import { expect, test } from "./fixtures/test";

import { seedAuth } from "./fixtures/auth";
import { seedDeployment } from "./fixtures/flags";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { mockInsights } from "./fixtures/insights-mocks";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import libraries from "./fixtures-data/libraries.json";

/**
 * VITE_LOCALE decides the English and the date order for a whole deployment, and a user can
 * override it. Asserted where both are visible: the Insights range picker, whose sections
 * run in the locale's order, and the page's `lang`, which screen readers pronounce by.
 */

const RANGE = "/consortium/insights?from=2026-09-01&to=2026-09-15";

async function openAs(page: Page, settings: Record<string, string>) {
	await seedDeployment(page, settings);
	await seedAuth(page);
	await mockInsights(page);
	await mockGraphQL(page, {
		LoadConsortiumHeader: consortiumBasics,
		LoadLibraries: libraries,
	});
}

/** The first date's three sections, in the order the reader meets them. */
async function expectDateOrder(page: Page, order: string[]) {
	const sections = page.getByRole("spinbutton");
	for (const [index, name] of order.entries()) {
		await expect(sections.nth(index)).toHaveAccessibleName(name);
	}
}

test("a deployment that sets nothing reads British English, day first", async ({
	page,
}) => {
	await openAs(page, {});
	await page.goto(RANGE);

	await expectDateOrder(page, ["Day", "Month", "Year"]);
	await expect(page.locator("html")).toHaveAttribute("lang", "en-GB");

	await page.goto("/serviceInfo");
	await expect(
		page.getByRole("link", { name: /Catalogue metrics/ }).first(),
	).toBeVisible();
});

test("an en-US deployment reads American English, month first", async ({
	page,
}) => {
	await openAs(page, { VITE_LOCALE: "en-US" });
	await page.goto(RANGE);

	await expectDateOrder(page, ["Month", "Day", "Year"]);
	await expect(page.locator("html")).toHaveAttribute("lang", "en-US");

	await page.goto("/serviceInfo");
	await expect(
		page.getByRole("link", { name: /Catalog metrics/ }).first(),
	).toBeVisible();
});

test("a user can choose the other English, and keeps it across a reload", async ({
	page,
}) => {
	await openAs(page, {});
	await page.goto("/settings");

	await page.getByRole("combobox", { name: "Language" }).click();
	await expect(
		page.getByRole("option", {
			name: "Consortium default: English (United Kingdom)",
		}),
	).toBeVisible();
	await page.getByRole("option", { name: "English (United States)" }).click();

	await expect(page.locator("html")).toHaveAttribute("lang", "en-US");

	await page.goto(RANGE);
	await expectDateOrder(page, ["Month", "Day", "Year"]);

	await page.reload();
	await expect(page.locator("html")).toHaveAttribute("lang", "en-US");
	await expectDateOrder(page, ["Month", "Day", "Year"]);
});
