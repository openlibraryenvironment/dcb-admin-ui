import { test, expect, type Page, type Route } from "@playwright/test";

import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import { scanForViolations } from "./fixtures/axe";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import {
	patronRequestDetailMocks,
	TRACKED_REQUEST,
} from "./fixtures/patron-request-detail";

/**
 * A patron request action says it is running, while it is running.
 *
 * `PageActionsMenu` closes on click, so an item's own disabled state is rendered inside a
 * menu the user can no longer see, and the only other feedback was the result snackbar -
 * which arrives after a round trip to a member library's LMS. Between the two there was
 * nothing at all.
 */

/**
 * The detail query, answered from a mutable status.
 *
 * The function form of `mockGraphQL` is called per request, so flipping the variable
 * between the POST and the refetch is what a real check for updates does: the same query,
 * a different answer.
 */
const mockDetailWithStatus = (page: Page, status: () => string) =>
	mockGraphQL(page, {
		LoadConsortium: consortiumBasics,
		LoadConsortiumHeader: consortiumBasics,
		LoadHostLms: { hostLms: { totalSize: 0, content: [] } },
		...patronRequestDetailMocks,
		LoadPatronRequest: () => ({
			patronRequests: {
				totalSize: 1,
				content: [{ ...TRACKED_REQUEST, status: status() }],
			},
		}),
	});

const mockAll = (page: Page) =>
	mockGraphQL(page, {
		LoadConsortium: consortiumBasics,
		LoadConsortiumHeader: consortiumBasics,
		LoadHostLms: { hostLms: { totalSize: 0, content: [] } },
		...patronRequestDetailMocks,
	});

/**
 * Hold the update POST open until the returned function is called.
 *
 * The in-flight state is the whole subject here, so it has to be observable: against an
 * immediate 200 the spinner and its message exist for less than a frame and the assertion
 * races the response rather than testing anything.
 */
const holdUpdate = async (page: Page) => {
	let release: () => void = () => {};
	const held = new Promise<void>((resolve) => {
		release = resolve;
	});

	await page.route("**/patrons/requests/*/update", async (route: Route) => {
		if (route.request().method() !== "POST") return route.fallback();
		await held;
		await route.fulfill({ status: 200, json: {} });
	});

	return release;
};

/**
 * The message a sighted user sees, as distinct from the announced copy.
 *
 * Both are deliberate and both carry the same words: the hidden region is mounted at all
 * times because an aria-live node that appears together with its text is not reliably
 * announced, so `getByText` matches two elements and has to be narrowed.
 */
const visibleProgress = (page: Page, text: string) =>
	page.locator("p", { hasText: text });

const openDetail = async (page: Page) => {
	await page.goto(`/patronRequests/${TRACKED_REQUEST.id}`);
	await expect(page.getByRole("button", { name: "Actions" })).toBeVisible();
};

test.beforeEach(async ({ page }) => {
	await seedAuth(page);
	await useAllFeatures(page);
	await mockAll(page);
});

test("says which action is running while it runs", async ({ page }) => {
	const release = await holdUpdate(page);
	await openDetail(page);

	await page.getByRole("button", { name: "Actions" }).click();
	await page.getByRole("menuitem", { name: "Check for updates" }).click();

	// The message, beside the trigger that was just used - not inside the menu, which
	// has closed, and not at the far end of the page where the snackbar lands.
	await expect(visibleProgress(page, "Checking for updates")).toBeVisible();

	release();
	await expect(page.getByText("Check complete")).toBeVisible();
	await expect(visibleProgress(page, "Checking for updates")).toHaveCount(0);
});

test("refuses a second action while the first is in flight", async ({
	page,
}) => {
	const release = await holdUpdate(page);
	await openDetail(page);

	await page.getByRole("button", { name: "Actions" }).click();
	await page.getByRole("menuitem", { name: "Check for updates" }).click();
	await expect(visibleProgress(page, "Checking for updates")).toBeVisible();

	// A guarded clean up POSTs the same /update endpoint before it cleans up, so letting
	// it start here would put two updates on one request.
	await page.getByRole("button", { name: "Actions" }).click();
	for (const name of ["Check for updates", "Force clean up"]) {
		await expect(page.getByRole("menuitem", { name })).toBeDisabled();
	}

	release();
});

test("announces the wait to assistive technology, not only visually", async ({
	page,
}) => {
	const release = await holdUpdate(page);
	await openDetail(page);

	await page.getByRole("button", { name: "Actions" }).click();
	await page.getByRole("menuitem", { name: "Check for updates" }).click();

	// A spinner carries no accessible name; without the live region the wait does not
	// exist for a screen-reader user, which is the state this page was in.
	const liveRegion = page.locator('[aria-live="polite"]', {
		hasText: "Checking for updates",
	});
	await expect(liveRegion).toHaveCount(1);

	release();
});

test("keeps the trigger in place and focusable while running", async ({
	page,
}) => {
	const release = await holdUpdate(page);
	await openDetail(page);

	const trigger = page.getByRole("button", { name: "Actions" });
	const before = await trigger.boundingBox();

	await trigger.click();
	await page.getByRole("menuitem", { name: "Check for updates" }).click();
	await expect(visibleProgress(page, "Checking for updates")).toBeVisible();

	// The message grows leftwards out of a right-aligned row, so the trigger must not
	// move: replacing it with a spinner would take the focus MUI just returned to it and
	// leave a keyboard user on <body>.
	const after = await trigger.boundingBox();
	expect(after?.x).toBe(before?.x);
	expect(after?.y).toBe(before?.y);
	await expect(trigger).toBeEnabled();

	release();
});

test("the in-flight state has no axe violations", async ({ page }) => {
	// The route-level gate scans pages at rest, so this transient DOM - a spinner, a live
	// region and a menu full of disabled items - is scanned nowhere else.
	const release = await holdUpdate(page);
	await openDetail(page);

	await page.getByRole("button", { name: "Actions" }).click();
	await page.getByRole("menuitem", { name: "Check for updates" }).click();
	await expect(visibleProgress(page, "Checking for updates")).toBeVisible();

	await scanForViolations(page);

	release();
});

test.describe("what the action changed", () => {
	// Each test registers its own detail mock. That has to happen inside the test, not
	// in beforeEach: page.route handlers run in reverse registration order, so the later
	// registration is the one that answers.

	test("says so when the status has not moved", async ({ page }) => {
		const status = "PICKUP_TRANSIT";
		await mockDetailWithStatus(page, () => status);
		await page.route("**/patrons/requests/*/update", (route) =>
			route.request().method() === "POST"
				? route.fulfill({ status: 200, json: {} })
				: route.fallback(),
		);
		await openDetail(page);

		await page.getByRole("button", { name: "Actions" }).click();
		await page.getByRole("menuitem", { name: "Check for updates" }).click();

		// The ordinary outcome of a poll, and the one a bare "Check complete" left the
		// user to work out by re-reading the page.
		await expect(
			page.getByText("The status is unchanged (PICKUP_TRANSIT)"),
		).toBeVisible();
	});

	test("names the new status when the request has moved on", async ({
		page,
	}) => {
		let status = "PICKUP_TRANSIT";
		await mockDetailWithStatus(page, () => status);
		await page.route("**/patrons/requests/*/update", (route) => {
			if (route.request().method() !== "POST") return route.fallback();
			status = "RECEIVED_AT_PICKUP";
			return route.fulfill({ status: 200, json: {} });
		});
		await openDetail(page);

		await page.getByRole("button", { name: "Actions" }).click();
		await page.getByRole("menuitem", { name: "Check for updates" }).click();

		await expect(
			page.getByText("The status is now RECEIVED_AT_PICKUP"),
		).toBeVisible();
	});
});
