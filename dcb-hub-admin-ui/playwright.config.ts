import { defineConfig, devices } from "@playwright/test";
import * as dotenv from "dotenv";

// Single source of truth for the Keycloak URL/client-ID constants baked
// into the e2e build - e2e/fixtures/auth.ts must seed localStorage under a
// key derived from these exact same values.
dotenv.config({ path: ".env.e2e" });

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	reporter: "html",

	use: {
		baseURL: "http://localhost:4173",
		trace: "on-first-retry",
	},

	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],

	webServer: {
		command: "npm run build && npm run preview -- --port 4173",
		url: "http://localhost:4173",
		reuseExistingServer: !process.env.CI,
		env: {
			VITE_KEYCLOAK_URL: process.env.VITE_KEYCLOAK_URL || "",
			VITE_KEYCLOAK_ID: process.env.VITE_KEYCLOAK_ID || "",
			VITE_DCB_API_BASE: process.env.VITE_DCB_API_BASE || "",
			VITE_DCB_SEARCH_BASE: process.env.VITE_DCB_SEARCH_BASE || "",
			VITE_MUI_X_LICENSE_KEY: process.env.VITE_MUI_X_LICENSE_KEY || "",
		},
		timeout: 120_000,
	},
});
