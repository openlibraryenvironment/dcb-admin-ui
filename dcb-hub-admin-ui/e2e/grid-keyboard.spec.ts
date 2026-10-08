import { test, expect } from "@playwright/test";

import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import libraries from "./fixtures-data/libraries.json";
import libraryCount from "./fixtures-data/library-count.json";
import patronRequests from "./fixtures-data/patron-requests.json";

/**
 * Every detail page in this application is reached through a grid row, and the grid
 * navigated on `onRowClick` alone - a pointer event MUI X does not raise for Enter.
 * A keyboard user could focus a cell, press Enter and reach nothing. WCAG 2.1.1,
 * Level A, across seventeen grid types.
 *
 * The axe gate scans /libraries and /patronRequests/all and passes both: no
 * automated rule can tell that a pointer handler has no keyboard equivalent. So
 * this walks the journey instead.
 */

test.beforeEach(async ({ page }) => {
	await seedAuth(page);
	await useAllFeatures(page);
	await mockGraphQL(page, {
		LoadConsortiumHeader: consortiumBasics,
		LoadLibraries: libraries,
		LoadLibraryCount: libraryCount,
		LoadPatronRequests: patronRequests,
	});
});

test("a library opens from the keyboard alone", async ({ page }) => {
	await page.goto("/libraries");

	// The leading VISIBLE column is the row's link - here the abbreviated name.
	// Its accessible name is read in row and column context, which is what WCAG
	// 2.4.4 means by "in context".
	const row = page.getByRole("link", { name: "ALPHA", exact: true });
	await expect(row).toBeVisible();

	await row.focus();
	await expect(row).toBeFocused();
	await page.keyboard.press("Enter");

	await expect(page).toHaveURL(
		/\/libraries\/c23df3ab-77c0-5689-b56d-fc8a2d6a5f22/,
	);
});

test("the row link is reachable by tabbing, not just focusable", async ({
	page,
}) => {
	await page.goto("/libraries");
	await expect(
		page.getByRole("link", { name: "ALPHA", exact: true }),
	).toBeVisible();

	// Start from the grid itself and tab forward. A link that is in the document
	// but not in the tab order is no use to the user this exists for; 40 presses
	// is generous for a toolbar plus a header row.
	await page.getByRole("grid").click();
	let reached = false;
	for (let press = 0; press < 40 && !reached; press += 1) {
		await page.keyboard.press("Tab");
		reached = await page
			.getByRole("link", { name: "ALPHA", exact: true })
			.evaluate((node) => node === document.activeElement)
			.catch(() => false);
	}
	expect(reached, "tabbing never reached the row link").toBe(true);
});

test("a mouse user still opens a row by clicking anywhere in it", async ({
	page,
}) => {
	// The link stops propagation so the row handler does not navigate twice; a
	// click on any OTHER cell must still route, or this fix has cost the
	// pointer journey it was meant to leave alone.
	await page.goto("/libraries");
	await expect(page.getByText("Alpha Test Library")).toBeVisible();

	await page.getByRole("gridcell").filter({ hasText: "Alpha" }).first().click();
	await expect(page).toHaveURL(
		/\/libraries\/c23df3ab-77c0-5689-b56d-fc8a2d6a5f22/,
	);
});
