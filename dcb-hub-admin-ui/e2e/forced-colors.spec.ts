import { test, expect, type Page } from "@playwright/test";

import { scanForViolations } from "./fixtures/axe";
import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import consortium from "./fixtures-data/consortium.json";
import libraries from "./fixtures-data/libraries.json";
import libraryCount from "./fixtures-data/library-count.json";

/**
 * Windows High Contrast Mode — `forced-colors: active`.
 *
 * <h2>Not the same thing as the high-contrast theme</h2>
 *
 * `/settings` offers a high-contrast PALETTE, which a user opts into and which this
 * application controls. This is the operating system throwing author colours away and
 * substituting its own, which many low-vision users run permanently and which no amount of
 * palette work reaches. The two are tested separately because they fail separately.
 *
 * <h2>What can and cannot be asserted here</h2>
 *
 * Contrast cannot: in forced colours the browser guarantees its own pairings, and axe
 * reports `color-contrast` as inapplicable rather than passing. What matters instead is
 * whether a control still has a BOUNDARY once its background is discarded - a contained
 * button becomes text on a canvas, indistinguishable from a label, unless something draws
 * an edge. That is exactly what `enhanceHighContrast` adds, and it is what these assert.
 */
const MOCKS = {
	LoadConsortiumHeader: consortiumBasics,
	LoadConsortium: consortium,
	LoadLibraries: libraries,
	LoadLibraryCount: libraryCount,
};

/*
 * `page.emulateMedia`, NOT `test.use({ forcedColors: "active" })`.
 *
 * The file-level fixture form silently does not take: the option is accepted, the run is
 * green, and `matchMedia("(forced-colors: active)")` is false inside the page - so every
 * assertion below would have been measuring an ordinary render. The first test in this
 * file is the guard that caught it, and is the reason it exists.
 */
test.beforeEach(async ({ page }) => {
	await page.emulateMedia({ forcedColors: "active" });
	await useAllFeatures(page);
	await seedAuth(page);
	await mockGraphQL(page, MOCKS);
});

/** Whether an element paints a border the user can actually see. */
const borderOf = (page: Page, selector: string) =>
	page.evaluate((sel) => {
		const element = document.querySelector(sel);
		if (!element) return null;
		const style = getComputedStyle(element);
		return {
			width: style.borderTopWidth,
			style: style.borderTopStyle,
			colour: style.borderTopColor,
		};
	}, selector);

test("the media feature actually reaches the application", async ({ page }) => {
	// Guards every assertion below: without this a passing run might simply be a
	// second ordinary run, which is the failure mode `expectPaintedScheme` exists for
	// in the colour-scheme gates.
	await page.goto("/libraries");
	await expect(page.getByText("Alpha Test Library")).toBeVisible();

	expect(
		await page.evaluate(
			() => window.matchMedia("(forced-colors: active)").matches,
		),
	).toBe(true);
});

test("contained buttons keep an edge when their background is discarded", async ({
	page,
}) => {
	await page.goto("/consortium");
	await expect(page.getByRole("tab", { name: /profile/i })).toBeVisible();

	const border = await borderOf(page, ".MuiButton-contained");

	// Measured before the theme rule that fixes this: background white, colour black,
	// `border: 0px none` - identical to the body beside it. MUI says "control" with a
	// fill, and a fill is precisely what forced colours discards.
	//
	// `enhanceHighContrast` does NOT cover this: it gives MuiButtonBase a focus outline
	// and nothing more. The border comes from this application's own MuiButton override.
	expect(border).not.toBeNull();
	expect(border?.style).not.toBe("none");
	expect(parseFloat(border?.width ?? "0")).toBeGreaterThan(0);
});

test("text fields keep an edge", async ({ page }) => {
	await page.goto("/settings");
	await expect(
		page.getByRole("radiogroup", { name: /typeface/i }),
	).toBeVisible();

	await page.goto("/consortium");
	await page.getByRole("button", { name: "Actions" }).click();
	await page.getByRole("menuitem", { name: "Edit" }).click();
	await expect(page.getByRole("button", { name: "Save" })).toBeVisible();

	const border = await borderOf(page, ".MuiOutlinedInput-notchedOutline");
	expect(border).not.toBeNull();
	expect(parseFloat(border?.width ?? "0")).toBeGreaterThan(0);
});

test("no accessibility violations under forced colours", async ({ page }) => {
	await page.goto("/libraries");
	await expect(page.getByText("Alpha Test Library")).toBeVisible();

	await scanForViolations(page);
});
