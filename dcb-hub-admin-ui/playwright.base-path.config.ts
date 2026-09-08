import { defineConfig, devices } from "@playwright/test";

import { E2E_KEYCLOAK_ID, E2E_KEYCLOAK_URL } from "./e2e/fixtures/keycloak";

// Port 4203: the base-path band (420x) for dcb-admin-ui (…3), per the allocation
// documented in playwright.config.ts.

/**
 * The app served from a PATH PREFIX, which is how it actually ships: CI builds it
 * with `VITE_PUBLIC_URL=/dcb-admin/` so one origin can host it alongside
 * dcb-admin-for-libraries at /dcb-admin-for-libraries.
 *
 * playwright.config.ts leaves the base at "/" for every other spec, so the shipped
 * configuration was the one configuration no test ran.
 */
const BASE_PATH = "/dcb-admin/";

export default defineConfig({
	testDir: "./e2e-base-path",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	// Four for the same reason as the main suite: several Chromiums against one preview.
	workers: 4,
	expect: { timeout: 10_000 },
	reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "html",

	use: {
		// The bare origin, NOT origin + BASE_PATH: every spec writes the base into the
		// URL it navigates to, so a base counted twice is visible in the assertion
		// rather than supplied invisibly by Playwright's URL resolution.
		baseURL: "http://localhost:4203",
		trace: "on-first-retry",
	},

	projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

	webServer: {
		command: "npm run build && npm run preview -- --port 4203 --strictPort",
		url: `http://localhost:4203${BASE_PATH}`,
		reuseExistingServer: !process.env.CI,
		env: {
			// Set for BOTH commands. `vite preview` reads the same config, so a base
			// given only to the build is served from somewhere else entirely.
			VITE_PUBLIC_URL: BASE_PATH,
			VITE_KEYCLOAK_URL: E2E_KEYCLOAK_URL,
			VITE_KEYCLOAK_ID: E2E_KEYCLOAK_ID,
			VITE_DCB_API_BASE: process.env.VITE_DCB_API_BASE || "",
			VITE_DCB_SEARCH_BASE: process.env.VITE_DCB_SEARCH_BASE || "",
			VITE_MUI_X_LICENSE_KEY: process.env.VITE_MUI_X_LICENSE_KEY || "",
		},
		timeout: 180_000,
	},
});
