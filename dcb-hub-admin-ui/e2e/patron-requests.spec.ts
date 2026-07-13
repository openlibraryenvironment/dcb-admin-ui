import { test, expect, Page } from "@playwright/test";
import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import libraries from "./fixtures-data/libraries.json";
import locations from "./fixtures-data/locations.json";
import patronRequests from "./fixtures-data/patron-requests.json";

const TABS = [
	{ path: "/patronRequests/exception", label: /^Exception/ },
	{ path: "/patronRequests/outOfSequence", label: /^Out of sequence/ },
	{ path: "/patronRequests/active", label: /^Active/ },
	{ path: "/patronRequests/completed", label: /^Completed/ },
	{ path: "/patronRequests/all", label: /^All/ },
];

const mockAll = (page: Page) =>
	mockGraphQL(page, {
		LoadConsortium: consortiumBasics,
		LoadConsortiumHeader: consortiumBasics,
		LoadLibraries: libraries,
		LoadLocationForPRGrid: locations,
		LoadPatronRequests: patronRequests,
		LoadPatronRequestTotals: patronRequests,
	});

test.describe("Patron request pages", () => {
	test.beforeEach(async ({ page }) => {
		await seedAuth(page);
		await mockAll(page);
	});

	// Every one of these pages passes its own route path to <PatronRequestTabs>
	// as the MUI Tabs `value`, and each Tab's value is the same path. If they
	// drift, MUI selects nothing, warns "None of the Tabs' children match with
	// undefined", and the tab bar shows no active indicator at all.
	for (const { path, label } of TABS) {
		test(`marks the right tab active on ${path}`, async ({ page }) => {
			const tabWarnings: string[] = [];
			page.on("console", (msg) => {
				if (msg.text().includes("Tabs")) tabWarnings.push(msg.text());
			});

			await page.goto(path);
			await expect(page.getByRole("tablist")).toBeVisible();

			await expect(page.getByRole("tab", { selected: true })).toHaveText(label);
			expect(tabWarnings).toEqual([]);
		});
	}

	// The grids used to pass a frozen `columnVisibilityModel` constant with no
	// onColumnVisibilityModelChange, so MUI held the model fixed and every toggle
	// in the columns panel was a no-op.
	test("column visibility toggles actually hide a column", async ({ page }) => {
		await page.goto("/patronRequests/exception");
		const previousStatus = page.getByRole("columnheader", {
			name: "Previous status",
			exact: true,
		});
		await expect(previousStatus).toBeVisible();

		// The columns panel opens from the toolbar's icon button, whose accessible
		// name comes from its tooltip.
		await page.getByRole("button", { name: "Find column" }).click();
		await page
			.getByRole("checkbox", { name: "Previous status", exact: true })
			.uncheck();
		await page.keyboard.press("Escape");

		await expect(previousStatus).toHaveCount(0);
	});
});
