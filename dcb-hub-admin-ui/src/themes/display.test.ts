import { describe, it, expect } from "vitest";

import {
	DEFAULT_DISPLAY,
	DENSITIES,
	MOTIONS,
	TEXT_SIZES,
	isDisplayValue,
	motionAttribute,
	rootFontSize,
	spacingUnit,
} from "./display";
import { getAppTheme, THEME_MODES, THEME_NAMES } from "./openRS";
import { FONT_NAMES } from "./fonts";

describe("display vocabularies", () => {
	it("defaults to today's appearance, so nobody's interface moves", () => {
		// The whole point of the defaults: adding these settings must be invisible until
		// somebody chooses. 100% is the browser default root size and 8 is MUI's own
		// spacing unit, which is what the application was built against.
		expect(DEFAULT_DISPLAY).toEqual({
			textSize: "normal",
			density: "comfortable",
			motion: "system",
		});
		expect(rootFontSize("normal")).toBe("100%");
		expect(spacingUnit("comfortable")).toBe(8);
	});

	it("scales monotonically and stays within one browser zoom step", () => {
		const sizes = TEXT_SIZES.map((size) => parseFloat(rootFontSize(size)));
		expect(sizes).toEqual([...sizes].sort((a, b) => a - b));
		// Beyond ~+12.5% browser zoom and the 400% reflow requirement are the right
		// tool, and the layout already meets those. A step that goes further is a step
		// that starts breaking a dense grid instead of helping.
		expect(Math.max(...sizes)).toBeLessThanOrEqual(112.5);
	});

	it("tolerates a value this build does not ship", () => {
		// Arrives from localStorage, not from a click, so no setter has validated it.
		// `undefined` reaching a CSS declaration is what this prevents.
		expect(rootFontSize("enormous" as never)).toBe("100%");
		expect(spacingUnit("airy" as never)).toBe(8);
	});

	it("recognises only its own vocabulary", () => {
		expect(isDisplayValue(TEXT_SIZES, "large")).toBe(true);
		expect(isDisplayValue(TEXT_SIZES, "huge")).toBe(false);
		expect(isDisplayValue(DENSITIES, undefined)).toBe(false);
		expect(isDisplayValue(MOTIONS, null)).toBe(false);
	});
});

describe("motion as an attribute rather than a theme value", () => {
	it("writes nothing for the system default", () => {
		// The CSS selects on the attribute's ABSENCE, so that the media query answers
		// this case on the first paint with no JavaScript involved.
		expect(motionAttribute("system")).toBeNull();
	});

	it("names an explicit choice in both directions", () => {
		expect(motionAttribute("reduced")).toBe("reduced");
		// "full" exists so a user can override an OS setting that is not theirs - a
		// shared or borrowed workstation, which is what this application runs on.
		expect(motionAttribute("full")).toBe("full");
	});
});

describe("the theme actually carries the display preferences", () => {
	const html = (theme: ReturnType<typeof getAppTheme>) =>
		(
			theme.components?.MuiCssBaseline?.styleOverrides as {
				html: { fontSize: string; scrollPaddingTop: string };
			}
		).html;

	it("moves the root font size, which is what scales the type", () => {
		expect(html(getAppTheme("openRS", "light", "roboto")).fontSize).toBe(
			"100%",
		);
		expect(
			html(
				getAppTheme("openRS", "light", "roboto", {
					textSize: "largest",
					density: "comfortable",
				}),
			).fontSize,
		).toBe("112.5%");
	});

	it("rebuilds spacing as a FUNCTION when density changes", () => {
		// The defect this guards. `theme.spacing` is a function; deep-merging a number
		// over a built theme replaces it, and every `sx={{ p: 2 }}` in the application
		// then throws. It is why getAppTheme builds rather than overlays.
		const compact = getAppTheme("openRS", "light", "roboto", {
			textSize: "normal",
			density: "compact",
		});

		expect(typeof compact.spacing).toBe("function");
		expect(compact.spacing(2)).toBe("12px");
		expect(getAppTheme("openRS", "light").spacing(2)).toBe("16px");
	});

	it("keeps focus clear of the fixed header (WCAG 2.4.11)", () => {
		expect(html(getAppTheme("openRS", "light")).scrollPaddingTop).toBe("70px");
	});

	/**
	 * THE INVARIANT THAT MAKES TEXT SIZE WORK AT ALL.
	 *
	 * Text size scales the root font size, and only `rem` follows the root. Eleven of
	 * these variants were px literals; left that way, raising the text size would have
	 * scaled MUI's own body variants and left every heading and the whole custom scale
	 * exactly where they were - a setting that half works, which is worse than one that
	 * does not exist.
	 *
	 * So this fails the moment somebody adds a variant in px, which is the only way the
	 * regression can happen.
	 */
	it("expresses every typography size in a unit that follows the root", () => {
		const theme = getAppTheme("openRS", "light");
		const offenders: string[] = [];

		// A bare number renders as px. `inherit` is MUI's own `inherit` variant and is
		// fine - it takes whatever its parent has, which is already scaled.
		const scalesWithRoot = (size: unknown) =>
			typeof size === "string" &&
			(size.endsWith("rem") ||
				size.endsWith("em") ||
				size.endsWith("%") ||
				size === "inherit");

		for (const [variant, value] of Object.entries(theme.typography)) {
			if (!value || typeof value !== "object") continue;
			const size = (value as { fontSize?: unknown }).fontSize;
			if (size === undefined) continue;
			if (!scalesWithRoot(size)) {
				offenders.push(`${variant}: ${String(size)}`);
			}
		}

		expect(offenders).toEqual([]);
	});

	it("builds every brand x mode x typeface x size x density without throwing", () => {
		// 720 combinations, all reachable from the settings panel. A token missing from
		// one brand is invisible to type-checking and to review; it is not invisible to
		// actually building the thing.
		for (const name of THEME_NAMES) {
			for (const mode of THEME_MODES) {
				for (const fontName of FONT_NAMES) {
					for (const textSize of TEXT_SIZES) {
						for (const density of DENSITIES) {
							const theme = getAppTheme(name, mode, fontName, {
								textSize,
								density,
							});
							expect(theme.palette.primary.main).toBeTruthy();
							expect(typeof theme.spacing).toBe("function");
						}
					}
				}
			}
		}
	});
});
