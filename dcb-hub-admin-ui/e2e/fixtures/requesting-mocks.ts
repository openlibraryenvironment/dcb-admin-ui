import type { Page } from "@playwright/test";

import clusterAvailability from "../fixtures-data/cluster-availability.json";

/**
 * The REST surface the three staff requesting forms write to.
 *
 * `/patron/auth/lookup` takes `{ patronPrinciple, agencyCode }`, and `patronPrinciple`
 * IS the patron's barcode - which is why this fixture exists at all and why
 * `requestErrorSummary` does. A test that drives these paths is also the only place the
 * barcode-in-the-console regression can be caught end to end.
 */
export const PATRON_BARCODE = "29551000123456";

/** Status "VALID" is what the form checks; anything else is a validation failure. */
export async function mockPatronLookup(
	page: Page,
	outcome: "valid" | "invalid" | "error",
) {
	await page.route("**/patron/auth/lookup", (route) => {
		if (outcome === "error") {
			// A 500 carrying the submitted body back, which is what a real service does
			// and what used to reach the console through the AxiosError.
			return route.fulfill({
				status: 500,
				json: {
					message: "Lookup failed",
					echo: route.request().postDataJSON(),
				},
			});
		}
		return route.fulfill({
			json:
				outcome === "valid"
					? {
							status: "VALID",
							localPatronId: ["p-1"],
							agencyCode: "alpha",
							systemCode: "alpha-lms",
						}
					: { status: "INVALID" },
		});
	});
}

/** The placement endpoints, all three of them. */
export async function mockPlaceRequest(
	page: Page,
	outcome: "created" | "duplicate" | "supplier_cannot_supply" | "rejected",
) {
	await page.route("**/patrons/requests/place**", (route) => {
		if (outcome === "created") {
			return route.fulfill({
				json: { id: "99aa0000-aaaa-5aaa-9aaa-999999999999" },
			});
		}
		return route.fulfill({
			status: 400,
			json: { failedChecks: [FAILED_CHECKS[outcome]] },
		});
	});
}

export const SUPPLIER_CANNOT_SUPPLY_DESCRIPTION =
	"At its last check (2026-10-15T09:00:00Z) Host LMS ALTOONA refused DCB's credentials. To fix: Correct the credentials for Host LMS ALTOONA in DCB Admin, then save it so DCB checks again";

const FAILED_CHECKS = {
	duplicate: {
		code: "DUPLICATE_REQUEST_ATTEMPT",
		description: "A request already exists",
	},
	supplier_cannot_supply: {
		code: "SUPPLIER_CANNOT_SUPPLY",
		description: SUPPLIER_CANNOT_SUPPLY_DESCRIPTION,
	},
	rejected: {
		code: "NO_ITEMS_SELECTABLE_AT_ANY_AGENCY",
		description: "Nothing available to supply",
	},
};

/** The live availability fan-out the request-details step reads. */
export async function mockAvailability(page: Page) {
	await page.route("**/items/availability*", (route) =>
		route.fulfill({ json: clusterAvailability }),
	);
}
