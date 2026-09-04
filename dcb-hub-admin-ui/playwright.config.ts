import { defineConfig, devices } from "@playwright/test";
import * as dotenv from "dotenv";

import { E2E_KEYCLOAK_ID, E2E_KEYCLOAK_URL } from "./e2e/fixtures/keycloak";

// Optional, and only ever an override. .env.e2e is git-ignored, so it exists on a
// developer's machine and never in CI - which is why the values the build and the auth
// fixture share are defined in e2e/fixtures/keycloak.ts and merely OVERRIDDEN here.
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
		// --strictPort: without it vite does not fail on a taken port, it quietly
		// increments to the next free one - which, under the workspace's 41<gate><repo>
		// allocation, is a neighbouring repo's. A suite that silently measures another
		// application does not look like a collision; it looks like a mystery.
		command: "npm run build && npm run preview -- --port 4173 --strictPort",
		url: "http://localhost:4173",
		reuseExistingServer: !process.env.CI,
		env: {
			// NOT `process.env.X || ""`. An empty authority builds an application whose
			// storage key is `oidc.user::`, while the fixture seeds the key built from the
			// fallbacks in e2e/fixtures/keycloak.ts - so with no .env.e2e the two disagreed
			// and every authenticated spec failed. Both sides now read the same constants.
			VITE_KEYCLOAK_URL: E2E_KEYCLOAK_URL,
			VITE_KEYCLOAK_ID: E2E_KEYCLOAK_ID,
			VITE_DCB_API_BASE: process.env.VITE_DCB_API_BASE || "",
			VITE_DCB_SEARCH_BASE: process.env.VITE_DCB_SEARCH_BASE || "",
			VITE_MUI_X_LICENSE_KEY: process.env.VITE_MUI_X_LICENSE_KEY || "",
		},
		timeout: 120_000,
	},
});
