import { test, expect, type Page, type Route } from "@playwright/test";

import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import { useLegacyService } from "./fixtures/legacy-service-mocks";
import { scanForViolations } from "./fixtures/axe";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import libraries from "./fixtures-data/libraries.json";
import locations from "./fixtures-data/locations.json";
import patronRequests from "./fixtures-data/patron-requests.json";

/**
 * Bulk clean up against both dcb-service releases this application supports.
 *
 * 9.0.0 refuses a clean up that would delete the borrowing library's virtual records while
 * the item is still out, and takes force=true to override that. 8.71.0 has neither, so the
 * UI's own status list is the only gate there - widened by requests tracking has given up
 * on, which consortium staff are otherwise unable to clear.
 */

const GAMMA = "Gamma stuck in transit";
const DELTA = "Delta still in transit";

// The tabs render rows from GetPatronRequestDashboard's `allRequests`, not from
// LoadPatronRequests - each tab's count comes from the same one request.
const dashboard = {
	allRequests: patronRequests.patronRequests,
	activeRequests: patronRequests.patronRequests,
	exceptionRequests: patronRequests.patronRequests,
	outOfSequenceRequests: patronRequests.patronRequests,
	finishedRequests: patronRequests.patronRequests,
};

const mockAll = (page: Page) =>
	mockGraphQL(page, {
		LoadConsortium: consortiumBasics,
		LoadConsortiumHeader: consortiumBasics,
		LoadLibraries: libraries,
		LoadLocationForPRGrid: locations,
		GetPatronRequestDashboard: dashboard,
		LoadPatronRequests: patronRequests,
		LoadPatronRequestTotals: patronRequests,
	});

/** Every cleanup and update call the run makes, in order, with its query string. */
const recordCleanupCalls = async (page: Page, calls: string[]) => {
	await page.route("**/api/patrons/requests/**", async (route: Route) => {
		const url = new URL(route.request().url());
		if (route.request().method() !== "POST") return route.fallback();

		calls.push(`${url.pathname}${url.search}`);

		// Only the still-tracked item-out request is refused, and only without the
		// override - which is what 9.0.0 answers. The too-long one is what 8.71.0 cleans
		// up directly, so refusing everything would hide that difference.
		if (
			url.pathname.endsWith("/transition/cleanup") &&
			url.pathname.includes("dd000000") &&
			!url.search
		) {
			return route.fulfill({
				status: 409,
				contentType: "application/problem+json",
				json: {
					title: "Cannot clean up a request while the item is out",
					detail:
						"The item for this request is not back at the supplying library (status PICKUP_TRANSIT).",
					patronRequestStatus: "PICKUP_TRANSIT",
					lastKnownItemOutStatus: "PICKUP_TRANSIT",
				},
			});
		}

		return route.fulfill({ status: 200, json: "ok" });
	});
};

const selectRow = async (page: Page, description: string) => {
	const row = page.getByRole("row", { name: new RegExp(description) });
	await expect(row).toBeVisible();
	await row.getByRole("checkbox").check();

	// The Actions button's label carries the selection count, so the toolbar re-renders
	// when the count arrives - and a menu opened before that has its items swapped out
	// underneath the click. Wait for the count, not for the button.
	await expect(
		page.getByRole("button", { name: /^Actions \(\d/ }),
	).toBeVisible();
};

const openCleanup = async (page: Page) => {
	await page.getByRole("button", { name: /^Actions/ }).click();
	await page.getByRole("menuitem", { name: /Force clean up selected/ }).click();
};

test.describe("Bulk clean up against dcb-service 9.0.0", () => {
	test.beforeEach(async ({ page }) => {
		await useAllFeatures(page);
		await seedAuth(page);
		await mockAll(page);
	});

	test("checks for updates, reports the refusal, and overrides it on request", async ({
		page,
	}) => {
		const calls: string[] = [];
		await recordCleanupCalls(page, calls);

		await page.goto("/patronRequests/all");
		await selectRow(page, DELTA);
		await openCleanup(page);

		// The refusal is reported rather than counted as a success or an error.
		const dialog = page.getByRole("dialog");
		await expect(
			dialog.getByText(/Refused while the item is out/),
		).toBeVisible();

		// ...and the request was checked for updates before cleanup was attempted.
		expect(calls).toEqual([
			expect.stringContaining("/update"),
			expect.stringMatching(/\/transition\/cleanup$/),
		]);

		// The dialog is a surface a user acts on, so it is held to the same floor.
		// scanForViolations asserts internally, as the gate's own specs call it.
		await scanForViolations(page);

		await dialog.getByRole("button", { name: /Clean up anyway/ }).click();

		const confirmation = page.getByRole("dialog", {
			name: /Clean up while the item is out/,
		});
		await expect(confirmation).toBeVisible();
		await scanForViolations(page);

		await confirmation.getByRole("button", { name: /Clean up anyway/ }).click();

		// Only the override carries force=true, and it does not poll a second time.
		await expect
			.poll(() => calls.filter((call) => call.includes("force=true")).length)
			.toBe(1);
		expect(calls.filter((call) => call.includes("/update"))).toHaveLength(1);
	});

	test("offers clean up for a request whose item is still out", async ({
		page,
	}) => {
		// The server decides on 9.0.0, so the grid does not pre-filter these away.
		await page.goto("/patronRequests/all");
		await selectRow(page, DELTA);
		await openCleanup(page);

		await expect(
			page.getByRole("dialog").getByText(/Not eligible/),
		).toHaveCount(0);
	});
});

test.describe("Bulk clean up against dcb-service 8.71.0", () => {
	test.beforeEach(async ({ page }) => {
		await useLegacyService(page);
		await seedAuth(page);
		await mockAll(page);
	});

	test("cleans up a stuck request directly, without checking for updates", async ({
		page,
	}) => {
		// 8.71.0 will not refuse, so there is nothing to override and no refresh to do:
		// the status list is the gate, and a too-long item-out request is on it.
		const calls: string[] = [];
		await recordCleanupCalls(page, calls);

		await page.goto("/patronRequests/all");
		await selectRow(page, GAMMA);
		await openCleanup(page);

		await expect(
			page.getByRole("dialog").getByText(/Successful/),
		).toBeVisible();
		expect(calls).toEqual([expect.stringMatching(/\/transition\/cleanup$/)]);
	});

	test("does not offer a request whose item is out and is still tracked", async ({
		page,
	}) => {
		await page.goto("/patronRequests/all");
		await selectRow(page, DELTA);
		await openCleanup(page);

		await expect(
			page.getByRole("dialog").getByText(/Not eligible/),
		).toBeVisible();
	});
});
