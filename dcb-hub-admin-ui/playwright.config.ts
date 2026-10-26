import { defineConfig, devices } from "@playwright/test";
import * as dotenv from "dotenv";

import { E2E_KEYCLOAK_ID, E2E_KEYCLOAK_URL } from "./e2e/fixtures/keycloak";

// Every gate has a preview port of its own, and --strictPort: docs/testing.md, "Preview ports"

// Optional, and only ever an override. .env.e2e is git-ignored, so it exists on a
// developer's machine and never in CI - which is why the values the build and the auth
// fixture share are defined in e2e/fixtures/keycloak.ts and merely OVERRIDDEN here.
// Quiet: its banner goes to stdout, which `playwright test --list --reporter=json` must keep as JSON
dotenv.config({ path: ".env.e2e", quiet: true });

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	// html for a person, junit for GitLab's Tests tab, json for the release report
	reporter: [
		["html", { open: "never" }],
		["junit", { outputFile: "reports/e2e-junit.xml" }],
		["json", { outputFile: "reports/e2e.json" }],
		["list"],
	],

	/*
	 * FOUR, not the default's 16 on this machine. All of them drive their own Chromium
	 * against ONE `vite preview`; server and CPU saturate and correct assertions fail with
	 * "element(s) not found". Measured on unmodified main, full suite:
	 *
	 *   16 workers ->  21 failed / 108 passed   1.8 min
	 *    4 workers ->   0 failed / 129 passed   2.0 min
	 *
	 * NOT a retry - `retries: 2` in CI already hides this. See docs/testing.md.
	 */
	workers: 4,

	// 10s against the 5s default, for the same reason `workers` is pinned: four Chromiums
	// share one preview server and the insights dashboard renders eight chart panels. A
	// broken assertion still fails, five seconds later.
	expect: { timeout: 10_000 },

	use: {
		baseURL: "http://localhost:4173",
		trace: "on-first-retry",
	},

	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
		{
			/*
			 * WCAG 2.2 1.4.10 Reflow at 320px. Measured clean before this project existed,
			 * which is a fact about one commit and not a property - the whole suite ran at one
			 * viewport and there is exactly one `useMediaQuery` holding the layout up.
			 *
			 * Scoped to the application-wide a11y spec. Insights is deliberately excluded: it
			 * does not stub the ILL stats API, so at 320px with four workers it tipped a
			 * different test over the timeout each run. See docs/testing.md.
			 */
			name: "narrow",
			use: {
				...devices["Desktop Chrome"],
				viewport: { width: 320, height: 640 },
			},
			testMatch: /(^|[\\/])accessibility\.spec\.ts$/,
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
			// Arms the missing-translation collector in this build, so
			// e2e/i18n-missing.spec.ts measures something. It only records to a page
			// variable - i18next calls missingKeyHandler instead of the backend's own
			// saveMissing, so nothing is posted. A build-time switch, deliberately: it
			// cannot be turned on against a deployed artefact. docs/i18n.md.
			VITE_I18N_REPORT_MISSING: "true",
		},
		// 600s, not 120s. The command is `npm run build && npm run preview`, and a cold
		// `tsc && vite build` on this estate uses most of two minutes - so under any extra
		// load the preview never started and EVERY spec failed against a dead port with
		// "element(s) not found". 120 of 153 specs failing is a convincing impression of a
		// broken application; `netstat` is the tell, with nothing LISTENING and only
		// SYN_SENT. docs/testing.md. The timeout is not the thing being tested, so there is
		// nothing to be gained by keeping it tight.
		timeout: 600_000,
	},
});
