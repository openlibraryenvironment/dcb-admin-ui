import { defineConfig, devices } from "@playwright/test";

import { E2E_KEYCLOAK_ID, E2E_KEYCLOAK_URL } from "./e2e/fixtures/keycloak";

/**
 * The gate that drives the CONTAINER - W-6.
 *
 * Every other gate in this repository measures `vite preview` or a mocked page, and
 * docs/testing.md records two production defects that lived in exactly that gap: the image
 * served 1,576 KB uncompressed where the budget approved 665 KB, and the Content Security
 * Policy blocked 40 font loads per session. Neither is visible to a preview server, which
 * compresses by default and ships no policy at all; a CSP violation is not a failed
 * request and not an exception, so `curl` and the nginx config test both missed it too.
 *
 * Port 4213. The workspace allocates `41<gate><repo>`, this repo's digit is 3, and 417x
 * (e2e), 418x (bootloader), 419x (Lighthouse) and 420x (base path) are taken - so this
 * gate opens the 421x band. Mapped from the container's port 80.
 */
const PORT = 4213;

export default defineConfig({
	testDir: "./e2e-container",
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,

	// ONE worker. There is one container, and these tests read its response headers
	// rather than racing each other through a UI; parallelism would buy nothing and the
	// image build already dominates the wall clock.
	workers: 1,

	reporter: [
		["html", { open: "never" }],
		["junit", { outputFile: "test-results/junit-container.xml" }],
		["list"],
	],

	use: {
		baseURL: `http://localhost:${PORT}`,
		trace: "on-first-retry",
	},

	projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

	webServer: {
		/*
		 * Builds the image and runs it, which is the whole point: the artefact under test
		 * is the one that ships, not a dist/ directory.
		 *
		 * `--rm` and no `--name`, so a re-run never collides with a container the last
		 * one left behind. The runtime config is rendered from these `-e` vars by
		 * docker-entrypoint.sh, and the Keycloak pair comes from the same constants the
		 * auth fixture seeds localStorage under - oidc-client-ts keys its store on
		 * `oidc.user:${authority}:${client_id}`, so a mismatch means no signed-in user.
		 *
		 * The build context is this directory, not the repository root: the Dockerfile
		 * COPYs `package.json` and `docker/production/*`, both of which live here. The
		 * repository-root docker-compose.yml names `docker/production/Dockerfile`
		 * relative to the root, where there is no docker/ at all.
		 */
		command: [
			"docker build -f docker/production/Dockerfile -t dcb-admin:container-gate .",
			// A FIXED NAME, and `npm run e2e:container` removes it BEFORE playwright
			// runs. Playwright's teardown kills the `docker run` client but has been
			// observed leaving the container up, and a leftover one holds the port.
			//
			// The cleanup cannot live here alone: with reuseExistingServer false,
			// playwright probes the url first and refuses outright when something
			// answers, so a command that would have cleaned up never runs. With it
			// true, the command is skipped for the opposite reason. Hence the npm
			// script. This copy only guards against a name collision.
			"docker rm -f dcb-admin-container-gate",
			[
				"docker run --rm --name dcb-admin-container-gate",
				`-p ${PORT}:80`,
				`-e VITE_KEYCLOAK_URL=${E2E_KEYCLOAK_URL}`,
				`-e VITE_KEYCLOAK_ID=${E2E_KEYCLOAK_ID}`,
				"-e VITE_DCB_API_BASE=https://dcb-api.invalid",
				"-e VITE_DCB_SEARCH_BASE=https://dcb-search.invalid",
				"dcb-admin:container-gate",
			].join(" "),
		].join(" && "),
		url: `http://localhost:${PORT}/index.html`,
		/*
		 * NEVER reuse. Every other gate here reuses a running `vite preview` locally,
		 * because starting one costs a two-minute build and serves the same tree.
		 * Reusing a CONTAINER means testing a different artefact: the image is built by
		 * the command above, so a container left running from an earlier run serves
		 * older code.
		 *
		 * Observed: a run reported "5 passed (3.2s)" against the previous image, and the
		 * two CSP tests failed on a violation the tree under test had already fixed.
		 * `reuseExistingServer` skips the command entirely, so the `docker rm -f` above
		 * did not run either - the cleanup cannot live only there.
		 */
		reuseExistingServer: false,
		// `npm ci` and `tsc && vite build` inside Alpine, from a cold layer cache. The
		// timeout is not the thing being tested.
		timeout: 900_000,
	},
});
