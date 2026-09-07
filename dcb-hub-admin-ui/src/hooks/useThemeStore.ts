import { create } from "zustand";
import { persist } from "zustand/middleware";

import { THEME_MODES, type ThemeName, type ThemeMode } from "@themes/openRS";
import { DEFAULT_FONT, isFontName, type FontName } from "@themes/fonts";
import {
	DEFAULT_DISPLAY,
	DENSITIES,
	isDisplayValue,
	MOTIONS,
	TEXT_SIZES,
	type Density,
	type Motion,
	type TextSize,
} from "@themes/display";
import { storageKey } from "@helpers/appBase";

/**
 * Every appearance preference this application has, and all of them PER USER.
 *
 * None of this is a property of the consortium. A consortium-wide typeface or text size
 * would let one administrator decide what a colleague's screen looks like, which is the
 * opposite of an accessibility feature.
 *
 * Nothing here reaches a server yet. When a user-preferences API exists these become the
 * client half of a sync (symposia-ui already does this, merging on a `updatedAt` stamp);
 * until then localStorage is the whole story, and the sign-out purge in `appBase.ts`
 * clears it along with everything else this app owns.
 */
type ThemePreferences = {
	themeName: ThemeName;
	/**
	 * NULL MEANS "FOLLOW MY DEVICE", and it is the default.
	 *
	 * This used to be seeded from `prefers-color-scheme` once, at module scope, and
	 * immediately persisted as a concrete choice. Three things followed, all wrong: the
	 * operating system switching to dark at sunset did nothing while the app was open;
	 * it did nothing on the next visit either, because a value had already been written;
	 * and `prefers-contrast: more` was never consulted at all, so a user who had asked
	 * their OS for higher contrast was not given the high-contrast theme that exists.
	 *
	 * `useResolvedMode` is the only place that turns this null into a mode, so nothing
	 * else has to know that an unset mode is not a broken one.
	 */
	mode: ThemeMode | null;
	/**
	 * The reading typeface — W-6. PER USER, never per consortium: it is an
	 * accessibility and comfort preference belonging to whoever is looking at the
	 * screen, and a consortium-wide override would let one administrator impose a
	 * typeface on a colleague who needs a different one.
	 */
	fontName: FontName;
	/** Scales the whole type scale via the root font size. See themes/display.ts. */
	textSize: TextSize;
	/** MUI's spacing unit: how tight every gap in the interface is. */
	density: Density;
	/** Whether to animate. `system` defers to `prefers-reduced-motion`. */
	motion: Motion;
};

type ThemeActions = {
	setThemeName: (themeName: ThemeName) => void;
	setMode: (mode: ThemeMode | null) => void;
	setFontName: (fontName: FontName) => void;
	setTextSize: (textSize: TextSize) => void;
	setDensity: (density: Density) => void;
	setMotion: (motion: Motion) => void;
	/**
	 * One control that undoes the lot.
	 *
	 * A user who has made the interface unreadable while experimenting needs a way back
	 * that does not involve reading the thing they have just broken. It resets the display
	 * settings and the typeface, and deliberately NOT the brand theme: that is a
	 * deployment's identity rather than an accessibility setting, and resetting it would
	 * surprise somebody who only wanted their text size back.
	 */
	resetDisplay: () => void;
};

const isThemeMode = (value: unknown): value is ThemeMode =>
	typeof value === "string" && (THEME_MODES as string[]).includes(value);

export const useThemeStore = create<ThemePreferences & ThemeActions>()(
	persist(
		(set) => ({
			themeName: "openRS",
			mode: null,
			fontName: DEFAULT_FONT,
			...DEFAULT_DISPLAY,

			setThemeName: (themeName) => set({ themeName }),
			// Validated on the way in as well as on rehydrate: `null` is a legitimate
			// value here ("follow my device"), so an unrecognised string must become null
			// rather than being stored and resolved to a theme that does not exist.
			setMode: (mode) => set({ mode: isThemeMode(mode) ? mode : null }),
			setFontName: (fontName) =>
				set({ fontName: isFontName(fontName) ? fontName : DEFAULT_FONT }),
			setTextSize: (textSize) =>
				set({
					textSize: isDisplayValue(TEXT_SIZES, textSize)
						? textSize
						: DEFAULT_DISPLAY.textSize,
				}),
			setDensity: (density) =>
				set({
					density: isDisplayValue(DENSITIES, density)
						? density
						: DEFAULT_DISPLAY.density,
				}),
			setMotion: (motion) =>
				set({
					motion: isDisplayValue(MOTIONS, motion)
						? motion
						: DEFAULT_DISPLAY.motion,
				}),
			resetDisplay: () => set({ ...DEFAULT_DISPLAY, fontName: DEFAULT_FONT }),
		}),
		{
			name: storageKey("dcb-admin-theme"),
			/**
			 * Every field validated on the way out of storage, not just on the way in.
			 *
			 * A preference persisted before a control existed is absent; one persisted by
			 * a later build may name a value this build does not ship; one edited by hand
			 * may be anything at all. The setters above never run for any of those, because
			 * the value arrives from localStorage rather than from a click - so this is the
			 * only place that can catch them, and `undefined` reaching a CSS declaration is
			 * what it is catching.
			 *
			 * `mode` is the interesting one: an EXISTING user has "light" or "dark"
			 * persisted from the old module-scope seeding, and that is honoured as a choice
			 * rather than reset. It is the safe direction - they keep what they were
			 * seeing, and one visit to the picker puts them on "match my device".
			 */
			merge: (persisted, current) => {
				const stored = (persisted ?? {}) as Partial<ThemePreferences>;
				return {
					...current,
					...stored,
					mode: isThemeMode(stored.mode) ? stored.mode : null,
					fontName: isFontName(stored.fontName)
						? stored.fontName
						: DEFAULT_FONT,
					textSize: isDisplayValue(TEXT_SIZES, stored.textSize)
						? stored.textSize
						: DEFAULT_DISPLAY.textSize,
					density: isDisplayValue(DENSITIES, stored.density)
						? stored.density
						: DEFAULT_DISPLAY.density,
					motion: isDisplayValue(MOTIONS, stored.motion)
						? stored.motion
						: DEFAULT_DISPLAY.motion,
				};
			},
		},
	),
);
