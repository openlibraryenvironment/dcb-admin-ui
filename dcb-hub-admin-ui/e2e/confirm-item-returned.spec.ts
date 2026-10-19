import { type Page } from "@playwright/test";
import { test, expect } from "./fixtures/test";

import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import { scanForViolations, waitForDialogToSettle } from "./fixtures/axe";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import libraries from "./fixtures-data/libraries.json";
import {
	patronRequestDetailMocks,
	TRACKED_REQUEST,
} from "./fixtures/patron-request-detail";

const mockDetailWithStatus = (page: Page, status: () => string) =>
	mockGraphQL(page, {
		LoadConsortium: consortiumBasics,
		LoadConsortiumHeader: consortiumBasics,
		LoadHostLms: { hostLms: { totalSize: 0, content: [] } },
		LoadLibraryDirectory: libraries,
		...patronRequestDetailMocks,
		LoadPatronRequest: () => ({
			patronRequests: {
				totalSize: 1,
				content: [{ ...TRACKED_REQUEST, status: status() }],
			},
		}),
	});

const openActions = async (page: Page) => {
	await page.goto(`/patronRequests/${TRACKED_REQUEST.id}`);
	await page.getByRole("button", { name: "Actions" }).click();
};

test.beforeEach(async ({ page }) => {
	await seedAuth(page);
});

test("confirms a parked request's item is back, and says what changed", async ({
	page,
}) => {
	await useAllFeatures(page);
	let status = "AWAITING_RETURN_TO_SUPPLIER";
	const posted: string[] = [];
	await mockDetailWithStatus(page, () => status);
	await page.route(
		"**/patrons/requests/*/transition/confirm-returned",
		(route) => {
			if (route.request().method() !== "POST") return route.fallback();
			posted.push(new URL(route.request().url()).pathname);
			status = "FINALISED";
			return route.fulfill({ status: 200, json: TRACKED_REQUEST.id });
		},
	);

	await openActions(page);
	await page.getByRole("menuitem", { name: "Confirm item is back" }).click();

	const dialog = page.getByRole("dialog", {
		name: "Confirm the item is back at the supplying library?",
	});
	await expect(dialog).toBeVisible();
	await dialog.getByRole("button", { name: "Confirm item is back" }).click();

	await expect(page.getByText("The status is now FINALISED")).toBeVisible();
	expect(posted).toHaveLength(1);
	expect(posted[0]).toMatch(
		new RegExp(
			`/patrons/requests/${TRACKED_REQUEST.id}/transition/confirm-returned$`,
		),
	);
});

test("reports the service's refusal rather than a success", async ({
	page,
}) => {
	await useAllFeatures(page);
	await mockDetailWithStatus(page, () => "RETURN_TRANSIT");
	await page.route(
		"**/patrons/requests/*/transition/confirm-returned",
		(route) =>
			route.fulfill({
				status: 409,
				contentType: "application/problem+json",
				json: {
					title: "This request is not waiting for its item to return",
					detail: "This request is LOANED.",
					patronRequestStatus: "LOANED",
				},
			}),
	);

	await openActions(page);
	await page.getByRole("menuitem", { name: "Confirm item is back" }).click();
	await page
		.getByRole("dialog")
		.getByRole("button", { name: "Confirm item is back" })
		.click();

	await expect(
		page.getByText("The item was not confirmed back. This request is LOANED."),
	).toBeVisible();
});

test("is not offered while the item has not started home", async ({ page }) => {
	await useAllFeatures(page);
	await mockDetailWithStatus(page, () => "PICKUP_TRANSIT");

	await openActions(page);

	await expect(
		page.getByRole("menuitem", { name: "Confirm item is back" }),
	).toBeDisabled();
});

test("is absent while the service does not offer it", async ({ page }) => {
	await mockDetailWithStatus(page, () => "AWAITING_RETURN_TO_SUPPLIER");

	await openActions(page);

	await expect(
		page.getByRole("menuitem", { name: "Check for updates" }),
	).toBeVisible();
	await expect(
		page.getByRole("menuitem", { name: "Confirm item is back" }),
	).toHaveCount(0);
});

test("the confirmation has no axe violations", async ({ page }) => {
	await useAllFeatures(page);
	await mockDetailWithStatus(page, () => "AWAITING_RETURN_TO_SUPPLIER");

	await openActions(page);
	await page.getByRole("menuitem", { name: "Confirm item is back" }).click();
	await expect(page.getByRole("dialog")).toBeVisible();
	await waitForDialogToSettle(page);

	await scanForViolations(page);
});
