// Lighthouse budget for dcb-admin-ui — W-2.
//
// This application had NO performance gate at all. The accessibility floor is enforced
// (axe, inside Playwright — see e2e/accessibility.spec.ts) and the payload was not, so
// nothing stood between the bundle and whatever the next dependency happened to weigh.
// This is that gate, modelled on symposia-ui's, which has been running long enough to
// have caught real regressions.
//
// WHAT IT AUDITS: the sign-in page. That is the whole application's shell — the router,
// the theme, i18next, the OIDC client and everything imported at module scope — served by
// `vite preview` with nothing behind it, and it is the first thing every user waits for.
// An authenticated page would need a Keycloak session and a live dcb-service, and would
// buy no signal this misses: for a SPA built on MUI X Premium, TanStack and i18next the
// dominant cost by a distance is the initial JavaScript payload, which is measured
// perfectly well with nothing to fetch.

// Lighthouse needs a real Chrome. Borrow the one Playwright already pins for the e2e
// suite rather than making the pipeline depend on a separately installed browser, so this
// audits in the same browser the specs run in and one dependency bump moves both.
const { chromium } = require("@playwright/test");
process.env.CHROME_PATH = process.env.CHROME_PATH || chromium.executablePath();

module.exports = {
	ci: {
		collect: {
			// BUILDS FIRST, deliberately, and on a port of its own.
			//
			// `npm run e2e:ki-bootstrap` rebuilds dist with `--base=/dcb-admin/` and
			// previews it on 4174. Serving that artefact from the root makes every script
			// tag a 404, so nothing executes, nothing paints, and Lighthouse fails the
			// whole run with `NO_FCP` - a message that reads as "your application does
			// not render" and sent this investigation down a blind alley for two runs.
			// Building here makes the budget independent of whatever last touched dist,
			// and 4175 keeps it out of the bootloader suite's way.
			startServerCommand: "npm run build && npm run preview -- --port 4175",
			// Match the PORT, not "Local:" — vite writes an ANSI reset between "Local"
			// and its colon, so a /Local:/ pattern never matches and lhci silently waits
			// out the full readiness timeout on every run.
			startServerReadyPattern: "4175",
			startServerReadyTimeout: 180000,
			url: ["http://localhost:4175/login"],
			numberOfRuns: 3,
			settings: {
				// Chrome throttles timers and suspends rendering in a window that is not
				// in the foreground, and a run that loses focus can die with `NO_FCP`.
				// Cheap insurance on a shared CI runner, where something else is always
				// competing for the machine.
				//
				// It is NOT what caused the NO_FCP failures seen while this file was
				// written — that was the base-path collision described above. Recorded so
				// nobody reads these flags as the fix for it and stops looking.
				chromeFlags: [
					"--headless=new",
					"--no-sandbox",
					"--disable-dev-shm-usage",
					"--disable-renderer-backgrounding",
					"--disable-background-timer-throttling",
					"--disable-backgrounding-occluded-windows",
				].join(" "),
			},
		},

		assert: {
			// Default is "optimistic", which asserts against the BEST run and lets a
			// regression through whenever one run happens to be lucky.
			//
			// This is load-bearing rather than a precaution. Runs are NOT identical: a
			// third run has been observed reporting 369,465 B / LCP 4,105 ms against
			// 653,582 B / 6,820 ms on the first two, because it served from a warm cache
			// and uncounted bytes do not appear in `total-byte-weight`. Under the default
			// aggregation that single lucky run would become the number every assertion
			// was checked against, and the budget would be measuring the cache.
			aggregationMethod: "median",

			assertions: {
				// THE SHARP EDGE: 750,000 B, against 653,582 B measured on a clean build
				// of this branch (2026-08-30, median of three). A cold run reports that
				// figure to the byte every time; see the aggregation note above for why
				// the median and not the minimum. This is the assertion that actually
				// holds the line, because bytes do not vary with the runner's CPU the way
				// every score-based threshold does.
				//
				// The ~14.8% of headroom is deliberate and is the same ratio symposia-ui
				// uses: enough to absorb ordinary feature work, tight enough to trip on a
				// heavyweight dependency.
				//
				// NEVER re-baseline this to make a build pass. A budget re-derived to sit
				// just above whatever today's bundle happens to be is a budget that
				// ratchets, and three of those in a row is how a bundle doubles.
				// Exceeding it means cutting weight or bringing a written argument.
				"total-byte-weight": ["error", { maxNumericValue: 750000 }],

				// 0.002 today. The frontend doctrine names CLS explicitly - skeletons
				// must match the dimensions of what replaces them - and it is the one
				// metric a reviewer cannot see in a diff. A hard error.
				"cumulative-layout-shift": ["error", { maxNumericValue: 0.05 }],

				// 99-126ms across three runs. 300ms is the edge of Lighthouse's "good"
				// band; this catches a synchronous parse or an accidental import of
				// something large, not ordinary drift. It is a real gate and not a
				// formality - a bundle that hoisted the premium grid onto this page was
				// measured at 454ms while it was being trialled.
				"total-blocking-time": ["error", { maxNumericValue: 300 }],

				// 1.00 today, and held there. Accessibility is ALSO gated by axe over far
				// more of the application than Lighthouse ever loads - this is a second,
				// cheaper net on the one page it does.
				"categories:accessibility": ["error", { minScore: 1 }],

				// 0.93 today. The gap is `errors-in-console`: the sign-in page's OIDC
				// client tries to reach the configured Keycloak, which does not exist in
				// a preview server. Worth recording rather than papering over with a
				// lower threshold, and worth fixing with a stub the way symposia-ui
				// stubbed its /api/capabilities call.
				"categories:best-practices": ["error", { minScore: 0.9 }],

				// 0.65 today. A floor below the measured figure, not at it: the score is
				// partly a function of the runner's CPU (total blocking time is not
				// simulated), and a gate that fails on a busy machine gets disabled by
				// whoever is unlucky enough to hit it first.
				"categories:performance": ["error", { minScore: 0.6 }],

				// ~6.83s, which is BAD and is recorded here rather than hidden.
				//
				// MEASURED CAUSE: 454ms of it is TTFB and 6,414ms - 93% - is render
				// delay. Nothing paints until 653 KiB across 122 requests has been
				// fetched, parsed and executed, because the sign-in page boots the entire
				// application: `routeTree.gen.ts` statically imports all 81 route
				// definitions and those pull `schemas`, `axios`, `dayjs` and the bundled
				// locale catalogue with them. Script evaluation alone is ~800ms on an
				// unthrottled desktop, which Lighthouse's 4x CPU throttling turns into
				// roughly 3 seconds before React can render anything.
				//
				// A warning and not an error, because the cause is the payload and that
				// already has a hard gate above - two hard gates on one cause means one
				// of them is noise. The threshold catches a step change, not the existing
				// state. Chunk-shaping was tried and does NOT fix it; see the note in
				// vite.config.mts and WELCOME_EXPERIENCE_PLAN.md §8 for what would.
				"largest-contentful-paint": ["warn", { maxNumericValue: 8000 }],

				// SEO is deliberately NOT asserted. This is an authenticated staff
				// console that must never be indexed; a perfect SEO score would be a
				// property nobody wants and asserting it would be a gate defending a
				// non-goal.
			},
		},

		upload: {
			target: "filesystem",
			outputDir: ".lighthouseci",
		},
	},
};
