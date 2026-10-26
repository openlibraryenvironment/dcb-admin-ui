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
	mockAvailability,
	mockPatronLookup,
} from "./fixtures/requesting-mocks";

/**
 * Expedited checkout and quick walk-up, the two requesting forms
 * requesting.spec.ts does not cover. Both handle a patron barcode.
 *
 * Why each reaches PatronValidationStep differently, and why the redaction
 * assertion is shaped the way it is: docs/testing.md, "The requesting journeys".
 */

// See requesting.spec.ts: useAllFeatures is named like a hook, so rules-of-hooks rejects
// a call from a named helper. Playwright callbacks are fine.
test.beforeEach(async ({ page }) => {
	await useAllFeatures(page);
	await mockGraphQL(page, MOCKS);
	await mockClusterRest(page);
	await mockAvailability(page);
});

/** The patron step both forms share, filled the same way. */
async function fillPatronStep(page: Page) {
	await page
		.getByRole("combobox", { name: /affiliated/i })
		.fill("Alpha Test Library");
	await page.getByRole("option", { name: "Alpha Test Library" }).click();
	await page
		.getByRole("textbox", { name: /patron barcode/i })
		.fill(PATRON_BARCODE);
}

/** Captures the ARGUMENTS passed to console.error, serialized in the page. */
async function captureConsole(page: Page) {
	// Why not message.text() or arg.jsonValue(): see requesting.spec.ts. Both versions
	// passed against a deliberately leaking form.
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
}

const logged = (page: Page) =>
	page.evaluate(() => (window as unknown as { __logged: string[] }).__logged);

function expectNoIdentifier(lines: string[]) {
	expect(
		lines.filter(
			(line) =>
				line.includes(PATRON_BARCODE) ||
				line.includes("patronPrinciple") ||
				line.includes("Bearer "),
		),
		"the console carried an identifier or a token",
	).toEqual([]);
}

test.describe("expedited checkout", () => {
	/** The cluster type picker, second option. */
	async function open(page: Page) {
		await seedAuth(page);
		await page.goto(`/search/${CLUSTER_ID}/cluster`);
		await expect(page.getByText("Date created").first()).toBeVisible();

		await page.getByRole("button", { name: "Actions" }).click();
		await page.getByRole("menuitem", { name: "Place a request" }).click();
		await page.getByRole("radio", { name: /Expedited checkout/i }).check();
		await page.getByRole("button", { name: "Continue" }).click();
	}

	test("is the picker second option and opens its own three steps", async ({
		page,
	}) => {
		await open(page);

		await expect(
			page.getByRole("dialog").getByText("Item checkout"),
		).toBeVisible();
		// Three steps, where a staff request has two: this one ends in a checkout.
		await expect(page.getByText("Patron validation")).toBeVisible();
		await expect(page.getByText("Request creation")).toBeVisible();
		await expect(page.getByText("Check out item")).toBeVisible();
	});

	test("a valid patron reaches the request step", async ({ page }) => {
		await mockPatronLookup(page, "valid");
		await open(page);
		await fillPatronStep(page);
		await page.getByRole("button", { name: "Validate" }).click();

		// No success alert on this form, unlike a staff request - it simply advances. The
		// request step appearing is what says the lookup was accepted.
		await expect(
			page.getByRole("combobox", { name: /pickup location/i }),
		).toBeVisible();
		await expect(
			page.getByRole("combobox", { name: /item local id/i }),
		).toBeVisible();
	});

	/*
	 * There is deliberately no placement test for this form.
	 *
	 * Submitting needs an item, and the item picker is disabled until `itemAgencyCode`
	 * has a value - which defaults to the signed-in member own `code` claim, because
	 * "the item agency code must match the user own". Seeding that claim then sends the
	 * form down a library lookup keyed on it, and the fixture chain for that is worth
	 * building when somebody tests the checkout step properly rather than as a side
	 * effect of this one. getRequestError mapping is already pinned through
	 * StaffRequest in requesting.spec.ts.
	 *
	 * The test below records what the picker does without that claim, which is what a
	 * consortium administrator sees.
	 */
	test(
		"a failed lookup writes no patron barcode to the console",
		proves(
			"A failed patron lookup writes no patron barcode to the browser's console.",
			["PRIV-01"],
		),
		async ({ page }) => {
			await captureConsole(page);
			await mockPatronLookup(page, "error");
			await open(page);
			await fillPatronStep(page);
			await page.getByRole("button", { name: "Validate" }).click();

			// It still tells the user, so this is not passing because nothing happened.
			await expect(
				page.getByText(/We were unable to validate this patron/),
			).toBeVisible();

			const lines = await logged(page);
			expect(
				lines.some((line) => line.includes("Patron lookup failed")),
				"nothing was logged, so this test cannot prove the redaction",
			).toBe(true);
			expectNoIdentifier(lines);
		},
	);

	test("without a staff agency on the token, the item cannot be chosen", async ({
		page,
	}) => {
		// What a consortium administrator sees, and recorded rather than fixed: this form
		// checks out an item from the signed-in member own library, so an account with no
		// library has nothing to offer. Contrast StaffRequest, where the same claim gated
		// a field the form did not actually need - that one WAS a defect.
		await mockPatronLookup(page, "valid");
		await open(page);
		await fillPatronStep(page);
		await page.getByRole("button", { name: "Validate" }).click();

		await expect(
			page.getByRole("combobox", { name: /pickup location/i }),
		).toBeVisible();
		await expect(
			page.getByRole("combobox", { name: /item local id/i }),
		).toBeDisabled();
	});
});

test.describe("quick walk-up", () => {
	/**
	 * From the shared index, NOT the cluster picker.
	 *
	 * CombinedRequestingModal deliberately offers only the two cluster-based flows:
	 * walk-up has no cluster context, so the picker is skipped entirely and the /search
	 * page action is the entry point.
	 */
	async function open(page: Page) {
		await seedAuth(page);
		await page.goto("/search");
		await expect(page.getByText("No data available").first()).toBeVisible();

		await page.getByRole("button", { name: "Actions" }).click();
		await page.getByRole("menuitem", { name: "Quick walk-up" }).click();
	}

	test("opens straight into the walk-up form, skipping the type picker", async ({
		page,
	}) => {
		await open(page);

		await expect(
			page.getByRole("dialog").getByText("Quick walk-up request"),
		).toBeVisible();
		// No picker: the dialog is already the form.
		await expect(
			page.getByRole("radiogroup", { name: "Request options" }),
		).toHaveCount(0);
		await expect(
			page.getByText(
				"Please provide the barcode and the affiliated institution of the patron.",
			),
		).toBeVisible();
	});

	test("a valid patron reaches the item scan step", async ({ page }) => {
		await mockPatronLookup(page, "valid");
		await open(page);
		await fillPatronStep(page);
		await page.getByRole("button", { name: "Validate" }).click();

		// Its second step asks for the item, where the other two ask for a request.
		await expect(
			page.getByRole("textbox", { name: /item barcode/i }),
		).toBeVisible();
	});

	test(
		"a failed lookup writes no patron barcode to the console",
		proves(
			"A failed patron lookup writes no patron barcode to the browser's console.",
			["PRIV-01"],
		),
		async ({ page }) => {
			await captureConsole(page);
			await mockPatronLookup(page, "error");
			await open(page);
			await fillPatronStep(page);
			await page.getByRole("button", { name: "Validate" }).click();

			await expect(
				page.getByText(/We were unable to validate this patron/),
			).toBeVisible();

			expectNoIdentifier(await logged(page));
		},
	);
});
