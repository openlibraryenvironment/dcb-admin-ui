import { describe, expect, it } from "vitest";
import { getAppTheme, THEME_NAMES, THEME_MODES } from "./openRS";
import { inkOn } from "../hooks/useChartPalette";

// Guards WCAG contrast across every brand x mode. This exists because the tokens
// are authored per brand and spread from a shared base: a light-mode value copied
// into a dark palette (or a brand hue reused as both ink and ground) is invisible
// to type-checking and to review, but not to arithmetic.
//
// light/dark target AA (4.5:1); highContrast promises AAA (7:1).

const AA = 4.5;
const AAA = 7;

const channel = (c: number) => {
	const s = c / 255;
	return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};

// MUI's default `text.primary` is `rgba(0, 0, 0, 0.87)`, not a hex. Parsing it
// as hex yields NaN, and `NaN < threshold` is false - so every text.primary pair
// used to pass without being measured. Both notations are parsed to [r,g,b,a].
const rgba = (colour: string): [number, number, number, number] => {
	const match = colour.match(/^rgba?\(([^)]+)\)$/);
	if (match) {
		const parts = match[1].split(",").map((p) => parseFloat(p.trim()));
		return [parts[0], parts[1], parts[2], parts[3] ?? 1];
	}
	const h = colour.replace("#", "");
	const full =
		h.length === 3
			? h
					.split("")
					.map((c) => c + c)
					.join("")
			: h;
	const at = (i: number) => parseInt(full.slice(i, i + 2), 16);
	return [at(0), at(2), at(4), 1];
};

const luminance = ([r, g, b]: [number, number, number, number]) =>
	0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);

// A translucent ink is only as dark as what shows through it, so composite it
// over its own background before measuring.
const over = (
	fg: [number, number, number, number],
	bg: [number, number, number, number],
): [number, number, number, number] => [
	fg[0] * fg[3] + bg[0] * (1 - fg[3]),
	fg[1] * fg[3] + bg[1] * (1 - fg[3]),
	fg[2] * fg[3] + bg[2] * (1 - fg[3]),
	1,
];

const contrast = (fg: string, bg: string) => {
	const ground = rgba(bg);
	const a = luminance(over(rgba(fg), ground));
	const b = luminance(ground);
	const [hi, lo] = a > b ? [a, b] : [b, a];
	return (hi + 0.05) / (lo + 0.05);
};

describe("theme contrast", () => {
	it.each(THEME_NAMES.flatMap((n) => THEME_MODES.map((m) => [n, m] as const)))(
		"%s/%s renders every token pairing above its threshold",
		(name, mode) => {
			const theme = getAppTheme(name, mode);
			const p = theme.palette.primary as unknown as Record<string, string>;
			// `transparent` surfaces resolve to the page beneath them.
			const solid = (c: string) =>
				c === "transparent" ? theme.palette.background.default : c;
			// StructuralLayout paints the content area with `pageBackground`, so that,
			// not `background.default`, is what page-level ink actually sits on. The
			// two differ per theme (Blue and White tints the page NHS grey #F0F4F5).
			const page = solid(p.pageBackground);
			const ink = theme.palette.text.primary;

			const pairs: [string, string, string][] = [
				["text.primary / page", ink, page],
				["text.primary / codeBlockBackground", ink, p.codeBlockBackground],
				[
					"text.primary / editableFieldBackground",
					ink,
					p.editableFieldBackground,
				],
				["text.primary / sidebar", ink, p.sidebar],
				["text.primary / titleArea", ink, p.titleArea],
				["text.primary / landingCard", ink, p.landingCard],
				[
					"text.primary / detailsAccordionSummary",
					ink,
					p.detailsAccordionSummary,
				],
				["text.primary / hover", ink, p.hover],
				["headerText / header", p.headerText, p.header],
				[
					"linkedFooterText / linkedFooterBackground",
					p.linkedFooterText,
					p.linkedFooterBackground,
				],
				["footerText / footerArea", p.footerText, p.footerArea],
				["navigationText / tabsBackground", p.navigationText, p.tabsBackground],
				[
					"navigationTextActive / tabsBackground",
					p.navigationTextActive,
					p.tabsBackground,
				],
				["loginText / loginCard", p.loginText, p.loginCard],
				[
					"searchResultTitle / searchResultBackground",
					p.searchResultTitle,
					p.searchResultBackground,
				],
				["attributeTitle / page", p.attributeTitle, page],
				["headingColor / page", p.headingColor, page],
				["hitCountText / page", p.hitCountText, page],
				["breadcrumbs / page", p.breadcrumbs, page],
				["linkText / page", p.linkText, page],
				["link / page", p.link, page],
				["primary.main / page", p.main, page],
				[
					"primary.contrastText / primary.main",
					theme.palette.primary.contrastText,
					p.main,
				],
				[
					"selectedText / buttonForSelectedPage",
					p.selectedText,
					p.buttonForSelectedPage,
				],
				[
					"selectedText / buttonForSelectedChildPage",
					p.selectedText,
					p.buttonForSelectedChildPage,
				],
				[
					"selectedText / inactiveBackground",
					p.selectedText,
					p.inactiveBackground,
				],
				["exclamationIcon / page", p.exclamationIcon, page],
			];

			const threshold = mode === "highContrast" ? AAA : AA;
			const failures = pairs
				.filter(([, fg]) => fg && fg !== "transparent")
				.map(([label, fg, bg]) => ({
					label,
					fg,
					bg: solid(bg),
					ratio: contrast(fg, solid(bg)),
				}))
				.filter((r) => r.ratio < threshold)
				.map(
					(r) =>
						`${r.label}: ${r.ratio.toFixed(2)}:1 (${r.fg} on ${r.bg}), needs ${threshold}:1`,
				);

			expect(failures).toEqual([]);
		},
	);
});

// The categorical/status palettes are built for chart MARKS. StatusFlowChart
// reuses a swatch as a chip ground, so `inkOn` must find a readable ink for
// every swatch - white alone fails on most of them.
describe("chart swatches as text grounds", () => {
	const SWATCHES = [
		// CATEGORICAL_LIGHT
		"#2a78d6",
		"#1baf7a",
		"#eda100",
		"#008300",
		"#4a3aa7",
		"#e34948",
		"#e87ba4",
		"#eb6834",
		// CATEGORICAL_DARK
		"#3987e5",
		"#199e70",
		"#c98500",
		"#9085e9",
		"#e66767",
		"#d55181",
		"#d95926",
		// STATUS
		"#0ca30c",
		"#fab219",
		"#ec835a",
		"#d03b3b",
	];

	it.each(SWATCHES)("inkOn(%s) clears AA", (swatch) => {
		expect(contrast(inkOn(swatch), swatch)).toBeGreaterThanOrEqual(AA);
	});
});
