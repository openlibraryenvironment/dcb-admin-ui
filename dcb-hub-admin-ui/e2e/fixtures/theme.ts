import type { Page } from "@playwright/test";

import type { ThemeMode, ThemeName } from "../../src/themes/openRS";
import type { FontName } from "../../src/themes/fonts";

/**
 * The localStorage key `useThemeStore` persists under.
 *
 * `src/helpers/appBase.ts` namespaces every persisted key by the app's runtime base, and
 * the e2e build is produced by a plain `npm run build` with no `VITE_PUBLIC_URL` - so
 * `import.meta.env.BASE_URL` is "/" and `getAppNamespace()` returns its "root" fallback.
 * Hardcoded here for the same reason `auth.ts` hardcodes the OIDC key: the test has to
 * write the entry BEFORE the app boots, so it cannot ask the app what the key is.
 *
 * If the e2e build ever gains a base path, this constant moves with it.
 */
const THEME_STORAGE_KEY = "root:dcb-admin-theme";

export interface SeedThemeOptions {
	mode?: ThemeMode;
	themeName?: ThemeName;
	fontName?: FontName;
}

/**
 * Start a test with an explicit appearance instead of whatever
 * `prefers-color-scheme` seeds.
 *
 * High contrast has no media query behind it - it is a stored choice, not an OS one - so
 * emulating a colour scheme cannot reach it and the only way to scan that mode is to plant
 * the preference. Call before `page.goto`.
 */
export async function seedTheme(page: Page, options: SeedThemeOptions = {}) {
	const state = {
		themeName: options.themeName ?? "openRS",
		mode: options.mode ?? "light",
		fontName: options.fontName ?? "roboto",
	};

	await page.addInitScript(
		([key, value]) => {
			window.localStorage.setItem(key, value);
		},
		[THEME_STORAGE_KEY, JSON.stringify({ state, version: 0 })] as const,
	);
}
