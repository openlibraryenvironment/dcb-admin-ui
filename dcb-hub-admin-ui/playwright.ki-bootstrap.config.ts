import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./e2e-ki-bootstrap",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	reporter: "html",

	use: {
		baseURL: "http://localhost:4183",
		trace: "on-first-retry",
	},

	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],

	webServer: {
		// Base path goes to the BUILD only, via vite's --base flag, so the built
		// artifact carries the /dcb-admin/ asset base the standalone-entry test needs
		// - while `vite preview` stays at "/" and keeps serving ki-bootstrap.js at the
		// root the health-check URL below expects.
		//
		// It must NOT be a "VITE_PUBLIC_URL=... npm run build" prefix (POSIX inline
		// assignment is a parse error under cmd.exe, so that form only ran on Linux
		// CI) and must NOT be a webServer.env var (that would reach `vite preview`
		// too, moving the bundle under /dcb-admin/ where the health check never finds
		// it). npm appends args after "--" to the last command in the chained build
		// script (`tsc && vite build`), so --base lands on `vite build`; a CLI --base
		// overrides the config base on every platform. "&&" is fine in cmd.exe and sh
		// alike - the standalone config chains the same way.
		command:
			"npm run build -- --base=/dcb-admin/ && npm run preview -- --port 4183 --strictPort",
		url: "http://localhost:4183/ki-bootstrap.js",
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
	},
});
