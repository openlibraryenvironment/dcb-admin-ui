import { describe, expect, it } from "vitest";

import { getAppTheme, THEME_MODES, THEME_NAMES } from "./openRS";
import {
	DEFAULT_FONT,
	FONTS,
	FONT_NAMES,
	fontStack,
	isFontName,
} from "./fonts";

/**
 * The typeface registry, measured — W-6 / W-14.
 *
 * The font is a third axis on a theme that already had two, so the properties that were
 * true of six brands x three modes have to stay true of six x three x five. This is the
 * cheap arithmetic that says so, in the same spirit as `openRS.contrast.test.ts`: the
 * tokens are authored by hand and a mistake in one of ninety combinations is invisible to
 * type-checking and to review.
 */

describe("font registry", () => {
	it("resolves every option to a real stack with a fallback", () => {
		for (const name of FONT_NAMES) {
			const stack = FONTS[name].stack;
			expect(stack.length).toBeGreaterThan(0);
			// A single family with no fallback renders in whatever the browser
			// defaults to the moment the woff2 is slow, blocked or missing - which on
			// a corporate network is not the rare case.
			expect(stack).toMatch(/,/);
			expect(stack.trim().endsWith("sans-serif")).toBe(true);
		}
	});

	it("falls back to the default for anything it does not ship", () => {
		// A preference persisted by a later build, or corrupted in localStorage, must
		// not put `undefined` into a CSS declaration.
		expect(fontStack("lexend")).toBe(FONTS.lexend.stack);
		expect(fontStack("comic-sans")).toBe(FONTS[DEFAULT_FONT].stack);
		expect(fontStack(undefined)).toBe(FONTS[DEFAULT_FONT].stack);
		expect(fontStack(null)).toBe(FONTS[DEFAULT_FONT].stack);
	});

	it("recognises only its own names", () => {
		expect(isFontName("roboto")).toBe(true);
		expect(isFontName("Roboto")).toBe(false);
		expect(isFontName(undefined)).toBe(false);
		expect(isFontName(7)).toBe(false);
	});

	it("keeps Roboto as the default so no deployment's appearance moves", () => {
		expect(DEFAULT_FONT).toBe("roboto");
	});
});

describe("getAppTheme with a typeface", () => {
	it("builds every brand x mode x typeface with the right family", () => {
		for (const themeName of THEME_NAMES) {
			for (const mode of THEME_MODES) {
				for (const fontName of FONT_NAMES) {
					const theme = getAppTheme(themeName, mode, fontName);
					expect(theme.typography.fontFamily).toBe(FONTS[fontName].stack);
				}
			}
		}
	});

	it("repoints every typography VARIANT, not just the top-level family", () => {
		// The defect this replaces: `createTheme(built, {typography:{fontFamily}})`
		// deep-merges without re-deriving, so h1, body1 and the rest kept the family
		// they were built with. `theme.typography.fontFamily` was the only correct
		// field in the object, and it is the one nothing reads - CssBaseline paints
		// the body from body1, and every Typography reads its own variant. The page
		// stayed in Roboto while the theme claimed to be in Lexend.
		const theme = getAppTheme("openRS", "light", "lexend");

		for (const variant of ["body1", "body2", "h1", "h2", "button"] as const) {
			expect((theme.typography as any)[variant].fontFamily).toBe(
				FONTS.lexend.stack,
			);
		}
	});

	it("keeps each variant's own size and weight when repointing it", () => {
		const base = getAppTheme("openRS", "light");
		const withFont = getAppTheme("openRS", "light", "inter");

		expect((withFont.typography as any).h1.fontSize).toBe(
			(base.typography as any).h1.fontSize,
		);
		expect((withFont.typography as any).h1.fontWeight).toBe(
			(base.typography as any).h1.fontWeight,
		);
	});

	it("returns the same object for the same combination", () => {
		// ThemeProvider is handed this value directly. A fresh theme object per render
		// re-renders the entire tree on every keystroke anywhere in the application.
		const first = getAppTheme("openRS", "dark", "inter");
		const second = getAppTheme("openRS", "dark", "inter");
		expect(first).toBe(second);
	});

	it("returns the untouched base theme for the default typeface", () => {
		// The common case must cost nothing: the base themes are already built with
		// this stack, so no overlay is created and no cache entry is spent.
		expect(getAppTheme("openRS", "light", DEFAULT_FONT)).toBe(
			getAppTheme("openRS", "light"),
		);
	});

	it("keeps every other token when the typeface changes", () => {
		// The overlay merges onto a built theme, so a mistake here would silently drop
		// a brand's palette rather than fail.
		const base = getAppTheme("mobius", "dark");
		const withFont = getAppTheme("mobius", "dark", "lexend");

		expect(withFont.palette.primary.main).toBe(base.palette.primary.main);
		expect(withFont.palette.mode).toBe("dark");
		expect(withFont.palette.background.default).toBe(
			base.palette.background.default,
		);
	});

	it("falls back to the default brand rather than throwing on an unknown one", () => {
		const theme = getAppTheme("nonsense" as any, "light", "inter");
		expect(theme.typography.fontFamily).toBe(FONTS.inter.stack);
	});

	it("keeps body text at 16px or larger in every combination", () => {
		// WCAG has no minimum size, but 16px is the browser default and dropping below
		// it is the change that quietly makes a dense admin console unreadable.
		for (const themeName of THEME_NAMES) {
			for (const mode of THEME_MODES) {
				for (const fontName of FONT_NAMES) {
					const theme = getAppTheme(themeName, mode, fontName);
					expect(theme.typography.fontSize).toBeGreaterThanOrEqual(14);
					expect(theme.typography.htmlFontSize).toBeGreaterThanOrEqual(16);
				}
			}
		}
	});
});
