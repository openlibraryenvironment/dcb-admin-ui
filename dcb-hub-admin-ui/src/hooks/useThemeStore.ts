import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { ThemeName, ThemeMode } from "@themes/openRS";
import { DEFAULT_FONT, isFontName, type FontName } from "@themes/fonts";
import { storageKey } from "@helpers/appBase";

type ThemePreferences = {
	themeName: ThemeName;
	mode: ThemeMode;
	/**
	 * The reading typeface — W-6. PER USER, never per consortium: it is an
	 * accessibility and comfort preference belonging to whoever is looking at the
	 * screen, and a consortium-wide override would let one administrator impose a
	 * typeface on a colleague who needs a different one.
	 */
	fontName: FontName;
};

type ThemeActions = {
	setThemeName: (themeName: ThemeName) => void;
	setMode: (mode: ThemeMode) => void;
	setFontName: (fontName: FontName) => void;
};

// Seed the initial mode from the OS preference; the user's explicit choice is
// then persisted and takes over on subsequent visits.
const prefersDark =
	typeof window !== "undefined" &&
	typeof window.matchMedia === "function" &&
	window.matchMedia("(prefers-color-scheme: dark)").matches;

export const useThemeStore = create<ThemePreferences & ThemeActions>()(
	persist(
		(set) => ({
			themeName: "openRS",
			mode: prefersDark ? "dark" : "light",
			fontName: DEFAULT_FONT,
			setThemeName: (themeName) => set({ themeName }),
			setMode: (mode) => set({ mode }),
			setFontName: (fontName) => set({ fontName }),
		}),
		{
			name: storageKey("dcb-admin-theme"),
			/**
			 * A preference persisted before the picker existed has no `fontName` at
			 * all, and one persisted by a later build may name a family this build
			 * does not ship. Both are ordinary, and both must resolve to the default
			 * rather than putting `undefined` into a CSS declaration.
			 */
			merge: (persisted, current) => {
				const stored = (persisted ?? {}) as Partial<ThemePreferences>;
				return {
					...current,
					...stored,
					fontName: isFontName(stored.fontName)
						? stored.fontName
						: DEFAULT_FONT,
				};
			},
		},
	),
);
