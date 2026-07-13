import { test, expect, Locator, Page } from "@playwright/test";
import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import locations from "./fixtures-data/locations.json";

// The locations grid is the honest test bed: it is server-filtered, and its
// "Last imported" column is a dateTime whose operators render the date-time
// pickers - by far the widest and tallest value inputs the panel has to host.

// A laptop-height viewport, so the panel sits near the bottom of the screen.
// This matters: popper only flips or shifts the panel when it no longer fits
// below its anchor, so a tall desktop viewport hides the bug entirely.
test.use({ viewport: { width: 1280, height: 430 } });

const columnSelect = (page: Page) =>
	page.locator(".MuiDataGrid-filterFormColumnInput .MuiSelect-select");
const operatorSelect = (page: Page) =>
	page.locator(".MuiDataGrid-filterFormOperatorInput .MuiSelect-select");
const valueCell = (page: Page) =>
	page.locator(".MuiDataGrid-filterFormValueInput");

const chooseOption = async (page: Page, name: string) => {
	await page.getByRole("option", { name, exact: true }).click();
	await page.waitForTimeout(250);
};

// Measured RELATIVE TO THE PANEL'S ANCHOR, so the numbers cannot be polluted by
// Playwright scrolling elements into view before it clicks them.
const measurePanel = async (page: Page) =>
	page.evaluate(() => {
		const panel = document
			.querySelector(".MuiDataGrid-panel")!
			.getBoundingClientRect();
		const anchor = document
			.querySelector('[data-id="gridPanelAnchor"]')!
			.getBoundingClientRect();
		return {
			dx: Math.round(panel.x - anchor.x),
			dy: Math.round(panel.y - anchor.y),
			width: Math.round(panel.width),
			height: Math.round(panel.height),
		};
	});

const centreY = async (locator: Locator) => {
	const box = (await locator.boundingBox())!;
	return box.y + box.height / 2;
};

const openFilterPanel = async (page: Page) => {
	await page.goto("/locations");
	await expect(page.getByText("Alpha Main Desk")).toBeVisible();
	await page.getByRole("button", { name: "Filters" }).click();
	await expect(page.locator(".MuiDataGrid-panel")).toBeVisible();
};

test.describe("Filter panel", () => {
	test.beforeEach(async ({ page }) => {
		await seedAuth(page);
		await mockGraphQL(page, {
			LoadConsortiumHeader: consortiumBasics,
			LoadLocations: locations,
		});
	});

	test("does not move when you change column or operator", async ({ page }) => {
		await openFilterPanel(page);
		const atRest = await measurePanel(page);

		// Every operator here swaps in a different value input. If any of them
		// renders at a different height, popper stops being able to fit the panel
		// below its anchor and flips it above - the panel visibly leaps up the
		// page. That is precisely what the "Local Time" helper text under the
		// single date picker used to do: it grew the panel from 130px to 145px,
		// and the panel jumped 181px.
		await columnSelect(page).click();
		await chooseOption(page, "Last imported");
		expect(await measurePanel(page)).toEqual(atRest);

		await operatorSelect(page).click();
		await chooseOption(page, "On or after");
		expect(await measurePanel(page)).toEqual(atRest);

		await operatorSelect(page).click();
		await chooseOption(page, "Last 30 Days");
		expect(await measurePanel(page)).toEqual(atRest);
	});

	test("lines the date picker up with the column and operator inputs", async ({
		page,
	}) => {
		await openFilterPanel(page);

		await columnSelect(page).click();
		await chooseOption(page, "Last imported");

		const column = await centreY(columnSelect(page));
		const operator = await centreY(operatorSelect(page));

		// The range picker renders a start and an end field. Both belong on the
		// same baseline as the selects beside them - they used to sit ~10px low,
		// because they were `standard` variant fields in an outlined panel.
		const fields = valueCell(page).locator('[role="group"]');
		await expect(fields).toHaveCount(2);

		expect(Math.abs(column - operator)).toBeLessThanOrEqual(2);
		for (const field of await fields.all()) {
			expect(Math.abs(column - (await centreY(field)))).toBeLessThanOrEqual(2);
		}

		// And they have to fit the cell they were given rather than being crushed
		// into it: at the old 190px width each field was 74px wide, far too narrow
		// to show "MM/DD/YYYY hh:mm aa".
		const cell = (await valueCell(page).boundingBox())!;
		for (const field of await fields.all()) {
			const box = (await field.boundingBox())!;
			expect(box.width).toBeGreaterThan(150);
			expect(box.x).toBeGreaterThanOrEqual(cell.x - 1);
			expect(box.x + box.width).toBeLessThanOrEqual(cell.x + cell.width + 1);
		}
	});
});
