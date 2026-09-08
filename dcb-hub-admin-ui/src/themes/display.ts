// ---------------------------------------------------------------------------
// Display preferences — text size, density and motion.
//
// These exist in symposia-ui, the PATRON application, and did not exist here. The
// argument for them is at least as strong in a staff console: a library administrator
// looks at this interface for a working day, where a patron looks at Symposia for a few
// minutes. The three settings below plus the typeface picker in `fonts.ts` are the four
// the neurodivergence literature names as reliably helping, and they were three short.
//
// PER USER, ALWAYS. None of this is a property of the consortium. A consortium-wide text
// size would let one administrator decide how large a colleague's screen text is, which
// is the opposite of an accessibility feature.
//
// The vocabularies are fixed and the values are here rather than in the store, so the
// arithmetic is testable without a React tree and the store stays a store.
// ---------------------------------------------------------------------------

export const TEXT_SIZES = ["small", "normal", "large", "largest"] as const;
export const DENSITIES = ["comfortable", "compact"] as const;
export const MOTIONS = ["system", "full", "reduced"] as const;

export type TextSize = (typeof TEXT_SIZES)[number];
export type Density = (typeof DENSITIES)[number];
export type Motion = (typeof MOTIONS)[number];

export type DisplayPreferences = {
	textSize: TextSize;
	density: Density;
	motion: Motion;
};

/**
 * The subset that reaches the theme.
 *
 * `motion` is absent on purpose: it is CSS on the root element rather than a theme
 * property (see `motionAttribute` below), so including it here would put a third axis into
 * `getAppTheme`'s cache key for a value the built theme does not depend on.
 */
export type ThemeDisplay = Pick<DisplayPreferences, "textSize" | "density">;

/**
 * What a user gets before they choose anything, and what "reset" returns them to.
 *
 * Every value here reproduces today's appearance exactly, so this change moves nobody's
 * interface until they ask it to: `normal` is a 100% root size, `comfortable` is MUI's
 * own 8px spacing unit, and `system` defers to `prefers-reduced-motion`.
 */
export const DEFAULT_DISPLAY: DisplayPreferences = {
	textSize: "normal",
	density: "comfortable",
	motion: "system",
};

/**
 * Text size as a percentage on the ROOT element, not as `typography.fontSize`.
 *
 * `typography.fontSize` was the obvious lever and it does not work here. MUI derives its
 * variants from it once, at `createTheme` time, and this theme then overrides h1..h4 and
 * fifteen custom variants with their own explicit sizes - so raising `fontSize` would
 * scale body text and leave every heading where it was. That is the same trap
 * `withFontFamily` in openRS.ts documents, in a different field.
 *
 * Scaling the root instead works because every one of those sizes is expressed in `rem`
 * (which is why the px literals in `typography` were converted), and `rem` resolves
 * against the root. One declaration moves the whole type scale together.
 *
 * Browser zoom is the other way to do this and is deliberately NOT what this is: zoom
 * scales the layout too, which is what makes pages break and what makes users blame
 * themselves. Scaling type alone keeps a dense admin grid intact.
 *
 * The top step is +12.5%. Beyond that, browser zoom and the 400% reflow requirement are
 * the right tool, and the layout already meets those.
 *
 * <h2>The rule this creates for every component</h2>
 *
 * A px font size OPTS THAT ELEMENT OUT, silently. Ten existing `sx={{ fontSize: … }}`
 * declarations did exactly that, and six of them were `variant="h2" sx={{ fontSize: 32 }}`
 * — restating the variant's own 2rem in px, so they looked like no-ops and were not.
 *
 * ICONS ARE THE EXCEPTION AND SHOULD STAY IN PX. `fontSize` on an MUI icon is its box, not
 * text, and the five that remain are sized to something fixed: two sit inside the 70px
 * AppBar, which they would overflow, and two are status marks in a dense grid row. Scaling
 * those with the reading size is not the same request.
 */
const TEXT_SIZE_ROOT: Record<TextSize, string> = {
	small: "93.75%", // 15px
	normal: "100%", // 16px - the browser default, and today's appearance
	large: "106.25%", // 17px
	largest: "112.5%", // 18px
};

/**
 * MUI's spacing unit. Compact tightens every gap derived from it at once, which is the
 * whole point: a per-component density setting is a setting nobody finishes applying.
 *
 * This is why `getAppTheme` builds a theme rather than overlaying one. `theme.spacing` is
 * a FUNCTION, and `createTheme(builtTheme, { spacing: 6 })` deep-merges a number over it -
 * after which `sx={{ p: 2 }}` throws. Density has to be an argument to the build.
 */
const DENSITY_SPACING: Record<Density, number> = {
	comfortable: 8,
	compact: 6,
};

/** The root font size for a text-size step. */
export const rootFontSize = (textSize: TextSize): string =>
	TEXT_SIZE_ROOT[textSize] ?? TEXT_SIZE_ROOT[DEFAULT_DISPLAY.textSize];

/** The MUI spacing unit for a density. */
export const spacingUnit = (density: Density): number =>
	DENSITY_SPACING[density] ?? DENSITY_SPACING[DEFAULT_DISPLAY.density];

/**
 * Whether a stored value is still one this build knows about.
 *
 * Tolerated on read for the reason the typeface registry is: a preference written by a
 * later release, or edited in localStorage, arrives here from storage rather than from
 * code, and must render the default rather than put `undefined` into a CSS declaration.
 */
export function isDisplayValue<T extends readonly string[]>(
	allowed: T,
	value: unknown,
): value is T[number] {
	return (
		typeof value === "string" && (allowed as readonly string[]).includes(value)
	);
}

/**
 * The value of the `data-motion` attribute on `<html>`, or null when the user defers to
 * the operating system.
 *
 * Motion is the one display preference that does NOT reach the theme, and deliberately:
 * expressing it as an attribute plus two CSS rules (see `motionStyles` in openRS.ts)
 * keeps it out of the theme cache key, covers CSS animations MUI knows nothing about,
 * and - for the common `system` case - works from the media query alone, before any
 * JavaScript has decided anything.
 */
export const motionAttribute = (motion: Motion): string | null =>
	motion === "system" ? null : motion;
