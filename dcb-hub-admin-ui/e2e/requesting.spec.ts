import { type Page } from "@playwright/test";
import { test, expect } from "./fixtures/test";
import { proves } from "./fixtures/coverage";

import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import { MOCKS } from "./fixtures/routes";
import { CLUSTER_ID, mockClusterRest } from "./fixtures/cluster-mocks";
import {
	PATRON_BARCODE,
	SUPPLIER_CANNOT_SUPPLY_DESCRIPTION,
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
			`The patron ${PATRON_BARCODE} has been successfully validated for Alpha Test Library.`,
		),
	).toBeVisible();
	await expect(
		page.getByRole("combobox", { name: /pickup location/i }),
	).toBeVisible();
});

/** Validate the patron, pick a pickup location and submit a staff request. */
async function submitStaffRequest(page: Page) {
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
	await page.getByRole("button", { name: "Submit", exact: true }).click();
}

test("a rejected placement shows the mapped failed check", async ({ page }) => {
	await arrive(page);
	await mockPatronLookup(page, "valid");
	await mockPlaceRequest(page, "duplicate");

	// getRequestError maps DUPLICATE_REQUEST_ATTEMPT to its own message rather than the
	// generic "Error: {{code}}", and that mapping is the thing worth pinning: every other
	// code falls through to the generic one.
	await submitStaffRequest(page);
	await expect(
		page.getByText(/A request already exists for this patron/),
	).toBeVisible();
});

test("a supplier that cannot supply shows its own message with the remedy", async ({
	page,
}) => {
	await arrive(page);
	await mockPatronLookup(page, "valid");
	await mockPlaceRequest(page, "supplier_cannot_supply");

	await submitStaffRequest(page);
	const alert = page.getByText(/can't supply it because of a problem/);
	await expect(alert).toBeVisible();
	await expect(alert).toContainText(SUPPLIER_CANNOT_SUPPLY_DESCRIPTION);
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

test(
	"a failed lookup writes no patron barcode to the console",
	proves(
		"A failed patron lookup writes no patron barcode to the browser's console.",
		["PRIV-01"],
	),
	async ({ page }) => {
		/*
		 * Captured in the page, by wrapping console.error before the bundle loads.
		 * `message.text()` renders an Error as `JSHandle@error` and `jsonValue()` drops its
		 * non-enumerable properties: both passed against a deliberately leaking console.error.
		 * AxiosError's toJSON returns `config.data`, the request body holding patronPrinciple.
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
	},
);

test(
	"a validated patron leaves no barcode in browser storage, and what is stored is listed",
	proves(
		"After a patron is validated, no patron barcode is kept in the browser's local storage, session storage or cookies.",
		["PRIV-02"],
	),
	async ({ page }) => {
		await arrive(page);
		await mockPatronLookup(page, "valid");
		await openRequestingModal(page);
		await continueToStaffRequest(page);
		await fillPatronStep(page);
		await page.getByRole("button", { name: "Validate" }).click();
		await expect(
			page.getByText(
				`The patron ${PATRON_BARCODE} has been successfully validated for Alpha Test Library.`,
			),
		).toBeVisible();

		const stored = await page.evaluate(() => {
			const read = (storage: Storage) =>
				Array.from({ length: storage.length }, (_, index) => {
					const key = storage.key(index) ?? "";
					return { key, value: storage.getItem(key) ?? "" };
				});
			return { local: read(localStorage), session: read(sessionStorage) };
		});
		const cookies = await page.context().cookies();

		// Names only reach the report: the values hold a session, which nothing should publish.
		// The fixture's own markers are left out: the application never writes them
		const named = (entries: { key: string }[]) =>
			entries
				.map(({ key }) => key)
				.filter((key) => !key.startsWith("__e2e"))
				.sort();
		await test.info().attach("storage", {
			body: JSON.stringify({
				local: named(stored.local),
				session: named(stored.session),
				cookies: cookies.map(({ name }) => name).sort(),
			}),
			contentType: "application/json",
		});

		// Something was stored, so the assertion below is not passing over an empty browser
		expect(stored.local.length + stored.session.length).toBeGreaterThan(0);
		const holding = [
			...stored.local,
			...stored.session,
			...cookies.map(({ name, value }) => ({ key: name, value })),
		]
			.filter(({ key, value }) => `${key}${value}`.includes(PATRON_BARCODE))
			.map(({ key }) => key);
		expect(holding, "browser storage kept the patron barcode").toEqual([]);
	},
);
