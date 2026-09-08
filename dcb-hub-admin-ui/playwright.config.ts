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

	/*
	 * FOUR, NOT `os.cpus().length / 2`, AND IT IS MEASURED.
	 *
	 * Playwright's default gave 16 workers on a 32-thread machine. All sixteen drive their
	 * own Chromium against ONE `vite preview`, and the application they are loading is 665
	 * KB across 142 requests that has to boot the whole router before anything paints. The
	 * server and the CPU both saturate, pages miss the 5s expect timeout, and tests fail
	 * with "element(s) not found" on assertions that are perfectly correct.
	 *
	 * Measured on this machine, same commit, full suite:
	 *
	 *   16 workers ->  21 failed / 108 passed   1.8 min
	 *    4 workers ->   0 failed / 129 passed   2.0 min
	 *
	 * Twelve seconds slower and the difference between a suite that is evidence and one
	 * that is noise. It also failed 25, then 9, then 34 across three consecutive runs of
	 * the same tree, which is the signature: a count that moves is measuring the machine.
	 *
	 * THIS IS NOT A RETRY. `retries: 2` in CI already hides this, which is why it has gone
	 * unnoticed there while making every local run unusable as evidence - and a retry that
	 * masks contention masks a real regression just as effectively.
	 */
	workers: 4,

	/*
	 * 10s, against Playwright's 5s default, for the same reason `workers` is pinned.
	 *
	 * Four Chromiums share one `vite preview` serving an application that boots its whole
	 * router before it paints, and the heaviest page in it - the insights dashboard -
	 * renders eight panels of charts and tables. Under that contention a correct
	 * assertion on a correct page misses 5s: `insights-accessibility.spec.ts` failed once
	 * in a full run waiting for a heading that was on its way, and passed four times out
	 * of four in isolation.
	 *
	 * This is NOT a retry and not a relaxed budget. A genuinely broken assertion still
	 * fails, five seconds later; what it stops failing on is how busy the machine was.
	 * Retries were the other option and they are worse - they hide a real regression as
	 * readily as they hide contention.
	 */
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
			 * WCAG 2.2 1.4.10 Reflow: usable at 320 CSS px with no two-dimensional
			 * scrolling.
			 *
			 * This application is a desktop staff console and is audited as one - the
			 * Lighthouse budget uses the desktop preset for exactly that reason. Reflow is
			 * a conformance criterion regardless of who we expect to be holding the
			 * device, and it is the one an unmeasured layout change silently breaks.
			 *
			 * It was measured clean before this project existed: zero horizontal overflow
			 * and zero axe violations on all six routes at 320x640. That is a fact about
			 * one commit, not a property of the application - the whole suite ran at ONE
			 * viewport, and there is exactly one `useMediaQuery` in the entire codebase
			 * holding the responsive behaviour up.
			 *
			 * Scoped by `testMatch` to the application-wide accessibility spec rather than
			 * the whole suite. Re-running every journey at 320px would roughly double CI
			 * for a second copy of assertions that are not about layout; that one spec
			 * walks every route a user cannot avoid, which is the surface reflow breaks.
			 *
			 * INSIGHTS IS DELIBERATELY NOT IN SCOPE, and it is worth saying why rather
			 * than leaving the pattern to imply it. A looser pattern picked
			 * `insights-accessibility.spec.ts` up by accident, and it immediately earned
			 * its place: a serious `scrollable-region-focusable` on a table no keyboard
			 * user could scroll, now fixed in the theme for all twelve TableContainers.
			 *
			 * It is excluded anyway because it is not reliable here. That dashboard renders
			 * eight chart panels and calls the ILL stats API, which the spec does not stub -
			 * so the requests go through vite's proxy to an unset VITE_ILL_API_BASE and
			 * fail slowly ("Must set target or forward" in the server log). At 320px with
			 * four workers that tipped it over the assertion timeout on a different test
			 * each run: 1 failure, then 2, then 1, never the same one twice. A gate that
			 * fires on which tests happened to be slow is the gate everyone learns to
			 * ignore.
			 *
			 * Stubbing those calls is the fix and it belongs with that spec, not in this
			 * config. Until then the desktop project still scans the page.
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
		},
		timeout: 120_000,
	},
});
