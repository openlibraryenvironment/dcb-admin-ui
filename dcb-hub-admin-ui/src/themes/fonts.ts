// ---------------------------------------------------------------------------
// The typeface registry — W-6.
//
// A FIXED VOCABULARY, deliberately. A font name is a value that ends up inside a CSS
// declaration, so it is never taken from configuration, from a URL or from anything a user
// typed: the choice is an id from this list, and the stack beside it is the only string
// that reaches the theme.
//
// EVERY FAMILY IS SELF-HOSTED. None of these load from fonts.googleapis.com. A staff
// console that fetches a typeface from a third party makes every administrator's browser
// announce itself to that third party on every page load, which is a data-protection
// decision nobody has taken, and a supply-chain dependency on an origin we do not control.
// The @fontsource packages ship the woff2 files into our own bundle instead.
//
// Licences: Roboto is Apache-2.0 (already a dependency); Inter, Lexend and Atkinson
// Hyperlegible Next are OFL-1.1. All four are redistributable in a commercial product.
//
// PAYLOAD. The @font-face rules below cost a few KB of CSS each and NOTHING else: a
// browser fetches a woff2 only when something on the page is actually painted in that
// family. So declaring five families does not download five families — a user who never
// opens the picker downloads exactly the one they are reading in, which is the budget
// stated in the plan (baseline + at most one family).
// ---------------------------------------------------------------------------

import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import "@fontsource-variable/inter";
import "@fontsource-variable/lexend";
import "@fontsource-variable/atkinson-hyperlegible-next";

/**
 * The system stack. Costs zero bytes, which is the right answer for a deployment on a
 * constrained connection and the reason it is on the list at all.
 */
const SYSTEM_STACK =
	'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export interface FontOption {
	/** Translation key for the family's name as shown in the picker. */
	labelKey: string;
	/** Translation key for the one line saying who it is for. */
	descriptionKey: string;
	/** The value that reaches `typography.fontFamily`. */
	stack: string;
}

export const FONTS = {
	roboto: {
		labelKey: "theme.fonts.roboto.name",
		descriptionKey: "theme.fonts.roboto.description",
		stack: '"Roboto", "Helvetica", "Arial", sans-serif',
	},
	system: {
		labelKey: "theme.fonts.system.name",
		descriptionKey: "theme.fonts.system.description",
		stack: SYSTEM_STACK,
	},
	atkinsonHyperlegible: {
		labelKey: "theme.fonts.atkinsonHyperlegible.name",
		descriptionKey: "theme.fonts.atkinsonHyperlegible.description",
		stack:
			'"Atkinson Hyperlegible Next Variable", "Atkinson Hyperlegible", "Roboto", "Helvetica", "Arial", sans-serif',
	},
	inter: {
		labelKey: "theme.fonts.inter.name",
		descriptionKey: "theme.fonts.inter.description",
		stack:
			'"Inter Variable", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
	},
	lexend: {
		labelKey: "theme.fonts.lexend.name",
		descriptionKey: "theme.fonts.lexend.description",
		stack:
			'"Lexend Variable", "Lexend", "Roboto", "Helvetica", "Arial", sans-serif',
	},
} as const satisfies Record<string, FontOption>;

export type FontName = keyof typeof FONTS;

/**
 * Picker order: today's default first so an existing user recognises where they are, the
 * zero-payload option second, then the three that are a deliberate choice.
 */
export const FONT_NAMES = Object.keys(FONTS) as FontName[];

/** Unchanged from before the picker existed, so no deployment's appearance moves. */
export const DEFAULT_FONT: FontName = "roboto";

/**
 * The stack for a stored value.
 *
 * Tolerant on read for the same reason the discovery theme list is: a preference persisted
 * by a later build, or corrupted in localStorage, must render the default rather than put
 * `undefined` into a CSS declaration.
 */
export const fontStack = (name: string | null | undefined): string =>
	FONTS[(name ?? "") as FontName]?.stack ?? FONTS[DEFAULT_FONT].stack;

/** Whether a persisted value still names a family this build ships. */
export const isFontName = (value: unknown): value is FontName =>
	typeof value === "string" && value in FONTS;
