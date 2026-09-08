// The display preference vocabularies and the arithmetic that turns them into theme
// values. Kept out of the store so both are testable without a React tree.
//
// See docs/theming.md for why these settings exist and why they are per user.

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
 * Text size scales the ROOT element, not `typography.fontSize`. See docs/theming.md §1.
 *
 * The rule that follows for components: a px font size opts that element out, silently.
 * Icons are the exception and stay in px.
 */
const TEXT_SIZE_ROOT: Record<TextSize, string> = {
	small: "93.75%", // 15px
	normal: "100%", // 16px - the browser default, and today's appearance
	large: "106.25%", // 17px
	largest: "112.5%", // 18px
};

/**
 * MUI's spacing unit, and the reason getAppTheme builds rather than overlays: `theme.spacing`
 * is a FUNCTION, and merging a number over it makes every `sx={{ p: 2 }}` throw.
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
 * The `data-motion` value for `<html>`, or null when the user defers to the OS — in which
 * case the media query answers it alone. See docs/theming.md §5.
 */
export const motionAttribute = (motion: Motion): string | null =>
	motion === "system" ? null : motion;
