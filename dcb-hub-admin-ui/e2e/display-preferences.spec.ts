import { test, expect, type Page } from "@playwright/test";

import { seedAuth } from "./fixtures/auth";
import { seedTheme } from "./fixtures/theme";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import { scanForViolations } from "./fixtures/axe";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import consortium from "./fixtures-data/consortium.json";
import libraries from "./fixtures-data/libraries.json";
import libraryCount from "./fixtures-data/library-count.json";

/**
 * Text size, spacing and animation, read from COMPUTED STYLES.
 *
 * The unit tests prove the theme carries the right values. They cannot prove the page
 * renders differently, and that is exactly how this class of feature fails - the typeface
 * picker once shipped setting a theme field nothing reads.
 */
const MOCKS = {
	LoadConsortiumHeader: consortiumBasics,
	LoadConsortium: consortium,
	LoadLibraries: libraries,
	LoadLibraryCount: libraryCount,
};

// A file-wide beforeEach rather than a helper function: eslint's rules-of-hooks reads a
// bare call to `useAllFeatures(page)` inside a plain function as a misplaced React hook,
// and every other spec in this directory sets up the same way.
test.beforeEach(async ({ page }) => {
	await useAllFeatures(page);
	await seedAuth(page);
	await mockGraphQL(page, MOCKS);
});

const rootFontSizePx = (page: Page) =>
	page.evaluate(() =>
		parseFloat(getComputedStyle(document.documentElement).fontSize),
	);

const headingFontSizePx = (page: Page) =>
	page.evaluate(() => {
		const h1 = document.querySelector("h1");
		return h1 ? parseFloat(getComputedStyle(h1).fontSize) : 0;
	});

test.describe("text size", () => {
	test("scales the root and the headings with it", async ({ page }) => {
		await seedTheme(page, { textSize: "normal" });
		await page.goto("/");
		await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

		const baseRoot = await rootFontSizePx(page);
		const baseHeading = await headingFontSizePx(page);
		expect(baseRoot).toBeCloseTo(16, 1);
		// h1 is 2rem. If it were still the 32px literal it used to be, this would read
		// 32 here AND 32 below - which is the whole failure mode this guards.
		expect(baseHeading).toBeCloseTo(32, 1);

		await seedTheme(page, { textSize: "largest" });
		await page.goto("/");
		await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

		expect(await rootFontSizePx(page)).toBeCloseTo(18, 1);
		// THE ASSERTION THAT MATTERS: the heading moved too. A text-size setting that
		// scales body copy and leaves every heading behind is worse than none.
		expect(await headingFontSizePx(page)).toBeGreaterThan(baseHeading);
	});
});

test.describe("spacing", () => {
	test("tightens the interface without changing the type", async ({ page }) => {
		await seedTheme(page, { density: "comfortable" });
		await page.goto("/libraries");
		await expect(page.getByText("Alpha Test Library")).toBeVisible();
		const comfortable = await headingFontSizePx(page);

		await seedTheme(page, { density: "compact" });
		await page.goto("/libraries");
		await expect(page.getByText("Alpha Test Library")).toBeVisible();

		// Density is `theme.spacing`, which is px and independent of the type scale.
		// If this changed, density and text size are entangled and one of them is wrong.
		expect(await headingFontSizePx(page)).toBeCloseTo(comfortable, 1);

		// The real proof that spacing survived the rebuild: `theme.spacing` is a
		// FUNCTION, and the way this feature breaks is by deep-merging a number over a
		// built theme - after which every `sx={{ p: 2 }}` on the page throws and nothing
		// renders at all. A page that painted is that assertion.
		await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
	});
});

test.describe("animation", () => {
	const transitionDurations = (page: Page) =>
		page.evaluate(() =>
			Array.from(document.querySelectorAll("*"))
				.map((element) => getComputedStyle(element).transitionDuration)
				.filter((duration) => duration && duration !== "0s"),
		);

	test("reduced suppresses transitions across the whole page", async ({
		page,
	}) => {
		await seedTheme(page, { motion: "reduced" });
		await page.goto("/libraries");
		await expect(page.getByText("Alpha Test Library")).toBeVisible();

		await expect(page.locator("html")).toHaveAttribute(
			"data-motion",
			"reduced",
		);

		// Everything that still declares a duration must be at the 0.01ms floor. Not
		// zero: a zero duration skips transitionend, and MUI's own transition callbacks
		// wait on it.
		const durations = await transitionDurations(page);
		const tooSlow = durations.filter(
			(duration) => parseFloat(duration) > 0.001,
		);
		expect(tooSlow).toEqual([]);
	});

	test("system writes no attribute, so the media query answers it alone", async ({
		page,
	}) => {
		await seedTheme(page, { motion: "system" });
		await page.goto("/libraries");
		await expect(page.getByText("Alpha Test Library")).toBeVisible();

		// The absence IS the mechanism: the CSS selects on `:not([data-motion="full"])`
		// inside the media query, so the default case needs no JavaScript and works on
		// the first paint.
		await expect(page.locator("html")).not.toHaveAttribute("data-motion", /.*/);
	});

	test("full overrides an operating system that asks for reduced motion", async ({
		page,
	}) => {
		// A shared or borrowed workstation is exactly where an OS-level setting is
		// somebody else's, so an explicit choice has to win in BOTH directions.
		await page.emulateMedia({ reducedMotion: "reduce" });
		await seedTheme(page, { motion: "full" });
		await page.goto("/libraries");
		await expect(page.getByText("Alpha Test Library")).toBeVisible();

		await expect(page.locator("html")).toHaveAttribute("data-motion", "full");

		const durations = await transitionDurations(page);
		expect(durations.some((duration) => parseFloat(duration) > 0.001)).toBe(
			true,
		);
	});
});

/**
 * The settings panel is now eight controls rather than three, which is where accessible
 * names, grouping and focus order stop being obvious.
 */
test.describe("the settings panel", () => {
	test("offers every preference, and resets them", async ({ page }) => {
		await seedTheme(page, { textSize: "largest", density: "compact" });
		await page.goto("/settings");

		for (const name of [
			/theme/i,
			/mode/i,
			/typeface/i,
			/text size/i,
			/spacing/i,
			/animation/i,
		]) {
			await expect(page.getByRole("radiogroup", { name })).toBeVisible();
		}

		// "Match my device" is the absence of a stored mode, not a fourth mode - so it
		// has to be offered as an option or there is no way back to it.
		await expect(
			page.getByRole("radio", { name: /match my device/i }).first(),
		).toBeVisible();

		await expect(page.getByRole("radio", { name: "Largest" })).toBeChecked();

		await page
			.getByRole("button", { name: /reset appearance to defaults/i })
			.click();

		await expect(page.getByRole("radio", { name: "Normal" })).toBeChecked();
		await expect(
			page.getByRole("radio", { name: "Comfortable" }),
		).toBeChecked();
		expect(await rootFontSizePx(page)).toBeCloseTo(16, 1);
	});

	test("has no accessibility violations with every control on show", async ({
		page,
	}) => {
		await page.goto("/settings");
		await expect(
			page.getByRole("radiogroup", { name: /animation/i }),
		).toBeVisible();

		await scanForViolations(page);
	});
});
