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
 * Every appearance preference, all of them per user and none of them reaching a server
 * yet. See docs/theming.md section 5.
 */
type ThemePreferences = {
	themeName: ThemeName;
	/**
	 * NULL MEANS "FOLLOW MY DEVICE", and it is the default. `useResolvedMode` is the only
	 * place that resolves it, so nothing else has to know an unset mode is not a broken one.
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
	/** Resets the display settings and the typeface, deliberately NOT the brand theme. */
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
			 * Validated on the way OUT of storage, not just in. The setters never run for a
			 * value written by an older build, so this is the only place that can catch one.
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
