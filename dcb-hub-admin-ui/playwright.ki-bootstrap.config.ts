import { defineConfig, devices } from "@playwright/test";

// Port 4183: the bootloader band (418x) for dcb-admin-ui (…3). It was 4174 — the SAME
// port as the Lighthouse gate below-stairs in lighthouserc.js — so whichever ran first
// left a server the other silently reused. Allocation table in playwright.config.ts.

export default defineConfig({
	testDir: "./e2e-ki-bootstrap",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	outputDir: "test-results/ki-bootstrap",
	reporter: [
		["html", { open: "never", outputFolder: "playwright-report/ki-bootstrap" }],
		["junit", { outputFile: "reports/ki-bootstrap-junit.xml" }],
		["list"],
	],

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
		// --base goes to the build only: dist carries the /dcb-admin/ asset base the
		// standalone-entry test needs, and `vite preview` stays at "/", serving
		// ki-bootstrap.js where the health check looks. Not a "VITE_PUBLIC_URL=..." prefix,
		// a parse error under cmd.exe, nor webServer.env, which would reach the preview too.
		// npm appends args after "--" to the last command of `tsc && vite build`.
		// USE_EXISTING_BUILD serves the build verify_base_path's base-path suite has just made.
		command: `${process.env.USE_EXISTING_BUILD ? "" : "npm run build -- --base=/dcb-admin/ && "}npm run preview -- --port 4183 --strictPort`,
		url: "http://localhost:4183/ki-bootstrap.js",
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
	},
});
