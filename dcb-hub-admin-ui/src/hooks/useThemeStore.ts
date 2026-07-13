import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { ThemeName, ThemeMode } from "@themes/openRS";

type ThemePreferences = {
	themeName: ThemeName;
	mode: ThemeMode;
};

type ThemeActions = {
	setThemeName: (themeName: ThemeName) => void;
	setMode: (mode: ThemeMode) => void;
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
			setThemeName: (themeName) => set({ themeName }),
			setMode: (mode) => set({ mode }),
		}),
		{ name: "dcb-admin-theme" },
	),
);
