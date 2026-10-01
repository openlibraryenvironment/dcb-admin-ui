import { expect, test } from "@playwright/test";

import { ADMIN_ROLES, seedAuth } from "../e2e/fixtures/auth";
import { mockGraphQL } from "../e2e/fixtures/graphql-mocks";
import { useAllFeatures } from "../e2e/fixtures/flags";
import consortiumBasics from "../e2e/fixtures-data/consortium-basics.json";
import consortium from "../e2e/fixtures-data/consortium.json";
import libraries from "../e2e/fixtures-data/libraries.json";
import patronRequests from "../e2e/fixtures-data/patron-requests.json";

/**
 * The app mounted under a path prefix, which is how it ships: CI builds it with
 * `VITE_PUBLIC_URL=/dcb-admin/` so one origin can host it next to
 * dcb-admin-for-libraries at /dcb-admin-for-libraries.
 *
 * The base has exactly one owner: TanStack Router. It strips the base off
 * window.location on the way in, so `useLocation().pathname` is "/consortium", and
 * adds it back on the way out, so `<Link to="/consortium">` renders
 * href="/dcb-admin/consortium". Any code that prefixes the base itself before
 * handing a value to `to`, or compares a base-prefixed string against `pathname`,
 * counts it twice.
 *
 * Assertions here are written against the literal deployed paths for that reason: a
 * helper that built the expected URL from the same base string could double it too,
 * and would agree with the bug.
 */
const BASE = "/dcb-admin";

const MOCKS = {
	LoadConsortiumHeader: consortiumBasics,
	LoadConsortium: consortium,
	LoadLibraries: libraries,
	LoadPatronRequests: patronRequests,
	GetPatronRequestDashboard: patronRequests,
};

/**
 * Every root-relative anchor the page rendered.
 *
 * Root-relative, because those are the ones that can escape: an "http" href is meant
 * to leave and "#main-content" goes nowhere. This is the shape of the whole class of
 * defect - a plain anchor, a raw MUI Link, or ListItemButton component="a" - so the
 * check is "what did the page render", not "which component rendered it". An ESLint
 * rule was measured for this first and rejected: it catches a literal or template
 * href, and every remaining site in this app passes a VARIABLE, where most of them
 * are legitimately external.
 */
const internalHrefs = async (page: import("@playwright/test").Page) => {
	const hrefs = await page
		.locator('a[href^="/"]')
		.evaluateAll((anchors) =>
			anchors.map((anchor) => anchor.getAttribute("href") ?? ""),
		);
	return hrefs.filter((href) => href !== "");
};

test.describe("navigation under a deployment base path", () => {
	test.beforeEach(async ({ page }) => {
		await useAllFeatures(page);
		await seedAuth(page, { roles: ADMIN_ROLES });
		await mockGraphQL(page, MOCKS);
	});

	test("sidebar links carry the base exactly once", async ({ page }) => {
		await page.goto(`${BASE}/`);

		const links = page.getByRole("navigation").getByRole("link");
		await expect(links.first()).toBeVisible();

		for (const link of await links.all()) {
			const href = await link.getAttribute("href");
			expect(href).not.toBeNull();
			// One base segment, at the start, and no second one after it.
			// "/dcb-admin/dcb-admin/libraries" passes a naive prefix check and fails this.
			expect(href).toMatch(new RegExp(`^${BASE}(/|$)`));
			expect(href!.slice(BASE.length)).not.toContain(BASE);
		}
	});

	test("tab links carry the base exactly once", async ({ page }) => {
		await page.goto(`${BASE}/consortium`);

		const tabs = page
			.getByRole("tablist", { name: "Consortium" })
			.getByRole("tab");
		await expect(tabs.first()).toBeVisible();

		for (const tab of await tabs.all()) {
			const href = await tab.getAttribute("href");
			expect(href).not.toBeNull();
			expect(href).toMatch(new RegExp(`^${BASE}(/|$)`));
			expect(href!.slice(BASE.length)).not.toContain(BASE);
		}
	});

	test("clicking a tab lands on the page, not on Not Found", async ({
		page,
	}) => {
		await page.goto(`${BASE}/consortium`);

		await page
			.getByRole("tablist", { name: "Consortium" })
			.getByRole("tab", { name: "Environment" })
			.click();

		await expect(page).toHaveURL(`${BASE}/consortium/environment`);
		await expect(page.getByText("404 Page not found")).toHaveCount(0);
		await expect(
			page.getByRole("tab", { name: "Environment" }),
		).toHaveAttribute("aria-selected", "true");
	});

	test("the tab for the current route is indicated on a deep link", async ({
		page,
	}) => {
		// Entered by URL rather than by clicking, which is what a bookmark, a refresh
		// or a post-login redirect produces.
		await page.goto(`${BASE}/consortium/environment`);

		await expect(
			page.getByRole("tab", { name: "Environment", selected: true }),
		).toBeVisible();
	});

	test("mappings links stay inside the app", async ({ page }) => {
		// Reported on 2.0: plain anchors to "/mappings/…" were served from outside this
		// app, into DCB Admin for Libraries.
		await page.goto(`${BASE}/mappings`);

		const links = page.getByRole("main").locator('a[href*="/mappings/all"]');
		await expect(links).toHaveCount(2);
		for (const link of await links.all()) {
			expect(await link.getAttribute("href")).toMatch(
				new RegExp(`^${BASE}/mappings/all`),
			);
		}

		await links.first().click();
		await expect(page).toHaveURL(new RegExp(`${BASE}/mappings/all`));
	});

	// Every page, not every component: the sidebar and tab checks above each cover one
	// widget, and the escapes that reached production were elsewhere - the mappings
	// list, a staff request's view link, and the Insights return link below.
	for (const path of ["/", "/consortium", "/mappings", "/libraries"]) {
		test(`every internal link on ${path} carries the base`, async ({
			page,
		}) => {
			await page.goto(`${BASE}${path}`);
			await expect(
				page.getByRole("navigation").getByRole("link").first(),
			).toBeVisible();

			const hrefs = await internalHrefs(page);
			expect(hrefs.length).toBeGreaterThan(0);
			for (const href of hrefs) {
				expect(href, `"${href}" on ${path} leaves the app`).toMatch(
					new RegExp(`^${BASE}(/|$)`),
				);
				expect(
					href.slice(BASE.length),
					`"${href}" counts the base twice`,
				).not.toContain(BASE);
			}
		});
	}

	test("the Insights return link stays inside the app", async ({ page }) => {
		// A drill-down carries the view to return to as a search param, so the link is
		// reachable without rendering Insights. It was a raw MUI anchor with
		// href={from}: a root-relative href resolves against the ORIGIN, so under this
		// base it left for whatever sits at /consortium/insights on the shared root.
		await page.goto(
			`${BASE}/patronRequests/all?from=%2Fconsortium%2Finsights%3Ftab%3Dservice%26range%3D90d&fromLabel=Why%20requests%20fail`,
		);

		const back = page.getByRole("link", {
			name: "Back to insights: Why requests fail",
		});
		await expect(back).toBeVisible();
		// The base, once, and the view they left intact - the router reads `to` as a
		// pathname, so the query has to be handed over as search params or it is lost.
		await expect(back).toHaveAttribute(
			"href",
			`${BASE}/consortium/insights?tab=service&range=90d`,
		);

		await back.click();
		await expect(page).toHaveURL(
			`${BASE}/consortium/insights?tab=service&range=90d`,
		);
	});

	test("not found routes home to the app, not to the origin root", async ({
		page,
	}) => {
		// The origin hosts other apps. "Home" from this app's not-found page has to
		// mean this app's home - a bare "/" hands the visitor whatever is mounted at
		// the root, which under the shared-root deployment is nothing at all.
		await page.goto(`${BASE}/no-such-page`);

		await expect(
			page.getByRole("heading", { name: "404 Page not found" }),
		).toBeVisible();

		await page.getByRole("button", { name: "Go to Home page" }).click();

		await expect(page).toHaveURL(`${BASE}/`);
	});

	test("assets and the SPA fallback resolve under the base", async ({
		page,
	}) => {
		const notFound: string[] = [];
		page.on("response", (response) => {
			if (response.status() === 404) notFound.push(response.url());
		});

		// A deep link is the case that breaks a relative asset base: the host serves
		// index.html AT this URL, so "./assets/..." would resolve against
		// /dcb-admin/consortium/ and 404.
		await page.goto(`${BASE}/consortium/environment`);
		await expect(
			page.getByRole("tablist", { name: "Consortium" }),
		).toBeVisible();

		expect(notFound).toEqual([]);
	});
});

/**
 * The parts of the base that exist so two apps can share one origin. Nothing else
 * exercises them: every other spec runs at "/" where the namespace is "root" and a
 * missing base cannot be seen.
 */
test.describe("co-hosting under a shared origin", () => {
	test.beforeEach(async ({ page }) => {
		await seedAuth(page, { roles: ADMIN_ROLES });
		await mockGraphQL(page, MOCKS);
	});

	test("namespaces its stored state by the base, never as root", async ({
		page,
	}) => {
		await useAllFeatures(page);
		await page.goto(`${BASE}/consortium`);
		await expect(
			page.getByRole("tablist", { name: "Consortium" }),
		).toBeVisible();

		// Toggling the sidebar is a persisted preference, so it is a write this test
		// can rely on rather than one it hopes a data load performed.
		await page.getByRole("button", { name: /menu/i }).click();

		const keys = await page.evaluate(() => [
			...Object.keys(window.localStorage),
			...Object.keys(window.sessionStorage),
		]);

		// "root:" is what an unbased build produces. A sibling app on this origin
		// would claim the same keys, and last writer wins.
		expect(keys.filter((key) => key.startsWith("root:"))).toEqual([]);
		expect(
			keys.filter((key) => key.startsWith("dcb-admin:")).length,
		).toBeGreaterThan(0);
	});

	test("points at its own favicon, not the origin root's", async ({ page }) => {
		await useAllFeatures(page);
		await page.goto(`${BASE}/`);

		// With no <link rel="icon"> at all the browser asks the ORIGIN root for
		// /favicon.ico, which under a path prefix belongs to a sibling app or to
		// nothing - so the app shipped a favicon that was never requested. Vite
		// rewrites a root-absolute href in index.html for the base; it does not
		// rewrite public/ paths referenced from TSX.
		const icon = page.locator('link[rel="icon"]');
		await expect(icon).toHaveAttribute("href", `${BASE}/favicon.ico`);

		const response = await page.request.get(`${BASE}/favicon.ico`);
		expect(response.status()).toBe(200);
	});

	test("asks for its own runtime config, not the origin root's", async ({
		page,
	}) => {
		// Deliberately no useAllFeatures: seeding window.__APP_ENV__ short-circuits
		// getStandaloneConfig() before it fetches, which is the request under test.
		// A root-absolute "/inject_env.json" would collect whichever sibling app's
		// config happens to sit at the origin root - or nothing, and a silent
		// fallback to whatever was baked at build time.
		const requested: string[] = [];
		page.on("request", (request) => {
			if (request.url().includes("inject_env.json")) {
				requested.push(new URL(request.url()).pathname);
			}
		});

		await page.goto(`${BASE}/`);
		await expect
			.poll(() => requested.length, { timeout: 10_000 })
			.toBeGreaterThan(0);

		expect(requested).toEqual([`${BASE}/inject_env.json`]);
	});
});
