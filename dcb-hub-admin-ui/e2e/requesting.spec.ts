import { test, expect, type Page } from "@playwright/test";

import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import { MOCKS } from "./fixtures/routes";
import { CLUSTER_ID, mockClusterRest } from "./fixtures/cluster-mocks";
import {
	PATRON_BARCODE,
	mockAvailability,
	mockPatronLookup,
	mockPlaceRequest,
} from "./fixtures/requesting-mocks";

/**
 * The staff requesting journey - W-7.
 *
 * `StaffRequest`, `QuickWalkUp`, `ExpeditedCheckout` and `CombinedRequestingModal` had no
 * test of any kind. They are the only write path into patron requests from this
 * application and the only place a patron barcode is handled, so a regression here means
 * staff cannot place a request and nothing goes red.
 *
 * The last test in this file is the end-to-end half of the barcode-logging fix:
 * `safeErrorLog.test.ts` pins the helper, and this pins that the helper is actually what
 * the form calls.
 */

const CLUSTER_PAGE = `/search/${CLUSTER_ID}/cluster`;

// A file-wide beforeEach for everything that does not vary: useAllFeatures is named like
// a hook, so react-hooks/rules-of-hooks rejects a call to it from a named helper, and
// Playwright's own callbacks are fine. Matches the other specs in this directory.
test.beforeEach(async ({ page }) => {
	await useAllFeatures(page);
	await mockGraphQL(page, MOCKS);
	await mockClusterRest(page);
	await mockAvailability(page);
});

/** Sign in, open the cluster the request will be placed against, and wait for it. */
async function arrive(page: Page) {
	// Before the goto: seedAuth writes the OIDC session through addInitScript, which only
	// runs for navigations registered after it.
	await seedAuth(page);
	await page.goto(CLUSTER_PAGE);
	await expect(page.getByText("Date created").first()).toBeVisible();
}

/** Actions -> Place a request -> the type picker. */
async function openRequestingModal(page: Page) {
	await page.getByRole("button", { name: "Actions" }).click();
	await page.getByRole("menuitem", { name: "Place a request" }).click();
	await expect(page.getByRole("dialog")).toBeVisible();
}

/** The picker defaults to a staff request, so Continue is enough. */
async function continueToStaffRequest(page: Page) {
	await expect(
		page.getByRole("radiogroup", { name: "Request options" }),
	).toBeVisible();
	await page.getByRole("button", { name: "Continue" }).click();
	await expect(
		page.getByText(
			"Please provide the barcode and the affiliated institution of the patron.",
		),
	).toBeVisible();
}

async function fillPatronStep(page: Page, barcode = PATRON_BARCODE) {
	await page
		.getByRole("combobox", { name: /affiliated/i })
		.fill("Alpha Test Library");
	await page.getByRole("option", { name: "Alpha Test Library" }).click();
	await page.getByRole("textbox", { name: /patron barcode/i }).fill(barcode);
}

test("the type picker offers both cluster flows and opens the staff request", async ({
	page,
}) => {
	await arrive(page);
	await openRequestingModal(page);

	const options = page.getByRole("radiogroup", { name: "Request options" });
	await expect(options.getByRole("radio")).toHaveCount(2);

	await continueToStaffRequest(page);
	// Two steps, and the first is the one in progress.
	await expect(page.getByText("Patron validation")).toBeVisible();
	await expect(page.getByText("Request creation")).toBeVisible();
});

test("a failed lookup explains itself and leaves the patron step in error", async ({
	page,
}) => {
	await arrive(page);
	await mockPatronLookup(page, "invalid");
	await openRequestingModal(page);
	await continueToStaffRequest(page);
	await fillPatronStep(page);

	await page.getByRole("button", { name: "Validate" }).click();

	await expect(
		page.getByText(
			/We were unable to validate this patron\. Please correct the barcode/,
		),
	).toBeVisible();
	// Still on step one: a rejected patron must not advance to request creation.
	await expect(page.getByText("The patron barcode is valid.")).toHaveCount(0);
});

test("a valid patron advances to request creation", async ({ page }) => {
	await arrive(page);
	await mockPatronLookup(page, "valid");
	await openRequestingModal(page);
	await continueToStaffRequest(page);
	await fillPatronStep(page);

	await page.getByRole("button", { name: "Validate" }).click();

	await expect(
		page.getByText(
			`The patron ${PATRON_BARCODE} has been successfully validated`,
		),
	).toBeVisible();
	await expect(
		page.getByRole("combobox", { name: /pickup location/i }),
	).toBeVisible();
});

test("a rejected placement shows the mapped failed check", async ({ page }) => {
	await arrive(page);
	await mockPatronLookup(page, "valid");
	await mockPlaceRequest(page, "duplicate");
	await openRequestingModal(page);
	await continueToStaffRequest(page);
	await fillPatronStep(page);
	await page.getByRole("button", { name: "Validate" }).click();
	await expect(
		page.getByRole("combobox", { name: /pickup location/i }),
	).toBeVisible();

	// The only field still required: selectionType defaults to "automatic", and the
	// patron fields are already set.
	await page
		.getByRole("combobox", { name: /pickup location/i })
		.fill("Alpha Main Desk");
	await page.getByRole("option", { name: /Alpha Main Desk/ }).click();

	// getRequestError maps DUPLICATE_REQUEST_ATTEMPT to its own message rather than the
	// generic "Error: {{code}}", and that mapping is the thing worth pinning: every other
	// code falls through to the generic one.
	await page.getByRole("button", { name: "Submit", exact: true }).click();
	await expect(
		page.getByText(/A request already exists for this patron/),
	).toBeVisible();
});

/*
 * There is deliberately no test that a non-admin finds "Place a request" disabled.
 *
 * The cluster layout disables it on `!isAnAdmin` (ADMIN or CONSORTIUM_ADMIN), but
 * `canAccessDcbAdmin` admits exactly those two roles - so every account that can render
 * this page already passes the same check and the disabled state is unreachable. A
 * LIBRARY_READ_ONLY account never gets here at all; e2e/consortium-only-access.spec.ts
 * owns that redirect. Asserting the disabled branch would mean asserting a state no
 * account can be in.
 */

test("a failed lookup writes no patron barcode to the console", async ({
	page,
}) => {
	/*
	 * Captured IN THE PAGE, by wrapping console.error before the bundle loads.
	 *
	 * Two things defeat the obvious approaches. `message.text()` renders an object
	 * argument as `JSHandle@error`, so a text assertion passes while the barcode sits
	 * inside it - which is the exact shape of this defect. And `arg.jsonValue()` on an
	 * Error returns nothing useful, because Error's own properties are not enumerable;
	 * resolving it is also asynchronous, so the assertion can run first. Verified both:
	 * each version passed against a deliberately leaking console.error.
	 *
	 * Serializing in the page sees what was actually passed. axios defines
	 * AxiosError.prototype.toJSON, and the `config` it returns carries `data` - the
	 * request body, which is where patronPrinciple lives.
	 */
	await page.addInitScript(() => {
		(window as unknown as { __logged: string[] }).__logged = [];
		const original = console.error;
		console.error = (...args: unknown[]) => {
			for (const arg of args) {
				let rendered: string;
				try {
					rendered =
						typeof arg === "string"
							? arg
							: (JSON.stringify(arg) ?? String(arg));
				} catch {
					rendered = String(arg);
				}
				(window as unknown as { __logged: string[] }).__logged.push(rendered);
			}
			original(...args);
		};
	});

	await arrive(page);
	await mockPatronLookup(page, "error");
	await openRequestingModal(page);
	await continueToStaffRequest(page);
	await fillPatronStep(page);
	await page.getByRole("button", { name: "Validate" }).click();

	// The form must still tell the user, so this is not passing because nothing happened.
	await expect(
		page.getByText(/We were unable to validate this patron/),
	).toBeVisible();

	const logged = await page.evaluate(
		() => (window as unknown as { __logged: string[] }).__logged,
	);

	// It logged SOMETHING diagnosable first, so the assertion below is not vacuous.
	expect(
		logged.some((line) => line.includes("Patron lookup failed")),
		"nothing was logged, so this test cannot prove the redaction",
	).toBe(true);

	const leaked = logged.filter(
		(line) =>
			line.includes(PATRON_BARCODE) ||
			line.includes("patronPrinciple") ||
			line.includes("Bearer "),
	);
	expect(leaked, "the console carried an identifier or a token").toEqual([]);
});
