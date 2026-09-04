import { defineConfig, devices } from "@playwright/test";
import * as dotenv from "dotenv";

import { E2E_KEYCLOAK_ID, E2E_KEYCLOAK_URL } from "./e2e/fixtures/keycloak";

/*
 * PREVIEW PORT ALLOCATION — a workspace convention, not a per-repo preference.
 *
 * Three front-end repos sit side by side in this workspace and every one of them used to
 * bind 4173 and 4174, vite's default preview port and the next one up. Playwright's
 * `reuseExistingServer` (on whenever CI is not set) then does exactly what it says: if
 * something is already listening, it does not start a server, it USES that one. So a
 * preview left running by one repo silently serves another repo's test run — observed
 * more than once, including a suite that ran happily against a different application and
 * redirected to that application's identity provider.
 *
 * So every gate gets a port of its own, and the number says which:
 *
 *     4 1 <gate> <repo>
 *
 *   repo digit   3 dcb-admin-ui    4 dcb-admin-for-libraries    5 symposia-ui
 *   gate band    417x e2e    418x bootloader    419x Lighthouse    420x base-path
 *
 *   |              | e2e  | bootloader | Lighthouse | base-path |
 *   |--------------|------|------------|------------|-----------|
 *   | dcb-admin-ui | 4173 | 4183       | 4193       | -         |
 *   | …-libraries  | 4174 | 4184       | -          | 4204      |
 *   | symposia-ui  | 4175 | 4185       | 4195       | -         |
 *
 * This repo keeps 4173 for e2e and its bootloader gate moves off 4174, which now belongs
 * to dcb-admin-for-libraries. The Lighthouse gate is on 4193; it was previously on 4175,
 * which is symposia-ui's primary e2e port, and a preview that repo left running would
 * have been measured as this application — a failure that reports a number rather than an
 * error, which is the hard kind to notice.
 *
 * `--strictPort` on every gate, deliberately, and it was missing from the e2e command
 * here: without it vite does not fail when the port is taken, it quietly increments to
 * the next free one — which is a neighbour's, and is exactly the failure this removes.
 */

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
