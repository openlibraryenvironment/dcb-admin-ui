import { test, expect, type Page } from "@playwright/test";

import { seedAuth } from "../e2e/fixtures/auth";

/**
 * What only the container can be asked.
 *
 * See playwright.container.config.ts for why this gate exists. Everything here is a
 * property of nginx and of the policy it ships, so none of it is observable against
 * `vite preview`.
 */

/** Every violation the page reports, in the order the browser raised them. */
type Violation = { directive: string; blocked: string };

async function collectCspViolations(page: Page): Promise<Violation[]> {
	const violations: Violation[] = [];

	await page.exposeFunction("__reportCsp", (v: Violation) => {
		violations.push(v);
	});

	// addInitScript, so the listener is installed before the document's own scripts run.
	// A violation raised while the bundle boots is the common case and is exactly the one
	// a listener added afterwards would miss.
	await page.addInitScript(() => {
		document.addEventListener("securitypolicyviolation", (event) => {
			void (
				window as unknown as {
					__reportCsp: (v: Violation) => void;
				}
			).__reportCsp({
				directive: event.violatedDirective,
				blocked: String(event.blockedURI).slice(0, 200),
			});
		});
	});

	return violations;
}

/**
 * GUARD ON THE GUARD.
 *
 * A collector that is silently not wired reports zero violations on a page that is
 * breaking every rule, and a green run looks identical either way. This asserts the
 * listener fires, by doing the one thing `script-src 'self'` must refuse.
 */
test("the violation collector actually fires", async ({ page }) => {
	const violations = await collectCspViolations(page);
	await page.goto("/login");

	await page.evaluate(() => {
		const script = document.createElement("script");
		script.textContent = "window.__inlineRan = true;";
		document.head.appendChild(script);
	});

	await expect.poll(() => violations.length).toBeGreaterThan(0);
	// `script-src-elem`, not `script-src`: CSP Level 3 reports the EFFECTIVE directive,
	// and a blocked <script> element falls under the more specific one even though the
	// policy only names script-src. Either is this policy refusing inline script.
	expect(violations.map((v) => v.directive)).toEqual(
		expect.arrayContaining([expect.stringMatching(/^script-src(-elem)?$/)]),
	);
	// And it was blocked, not merely reported.
	expect(
		await page.evaluate(
			() => (window as unknown as { __inlineRan?: boolean }).__inlineRan,
		),
	).toBeUndefined();
});

test("the sign-in page raises no policy violation", async ({ page }) => {
	const violations = await collectCspViolations(page);

	await page.goto("/login");
	// The fonts and every MUI style are injected at runtime by Emotion, so the page has
	// to be painted before the absence of violations means anything.
	await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
	await page.evaluate(() => document.fonts.ready);

	expect(violations).toEqual([]);
});

test("an authenticated page raises no policy violation", async ({ page }) => {
	const violations = await collectCspViolations(page);
	await seedAuth(page);

	// The API base is a `.invalid` host, so every query fails and the route renders its
	// error state. That is fine and deliberate: this test is about the app shell's
	// styles, fonts and images, all of which are injected and fetched either way.
	await page.goto("/");
	await expect(page.getByRole("banner")).toBeVisible();
	await page.evaluate(() => document.fonts.ready);

	expect(violations).toEqual([]);
});

test("javascript and css above nginx's threshold are compressed", async ({
	page,
	request,
}) => {
	const assets = new Map<string, string>();
	page.on("response", (response) => {
		const url = response.url();
		if (/\/assets\/.*\.(js|css)$/.test(url)) {
			assets.set(url, response.headers()["content-encoding"] ?? "none");
		}
	});

	await page.goto("/login");
	await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

	// The gate would pass vacuously against a page that fetched nothing.
	expect(assets.size).toBeGreaterThan(0);

	/*
	 * ABOVE THE THRESHOLD ONLY. nginx.conf sets `gzip_min_length 1024`, so a chunk
	 * smaller than that is correctly served as-is - this application code-splits finely
	 * and ships dozens of sub-kilobyte chunks. Asserting on all of them failed on twelve
	 * files that are not defects.
	 *
	 * The size is measured from the DECOMPRESSED body, because content-length on a
	 * gzipped response is the compressed size and would compare against the wrong number.
	 */
	const GZIP_MIN_LENGTH = 1024;
	const uncompressed: string[] = [];

	for (const [url, encoding] of assets) {
		if (encoding !== "none") continue;
		const body = await request.get(url);
		if ((await body.body()).byteLength > GZIP_MIN_LENGTH) {
			uncompressed.push(url.replace(/^.*\/assets\//, "assets/"));
		}
	}

	// nginx's base image ships `gzip off`, and this image replaces only
	// conf.d/default.conf - so losing the gzip block in nginx.conf is a silent 2.4x
	// payload on the one hosting path no other gate measures.
	expect(uncompressed, "over 1 KB and served without content-encoding").toEqual(
		[],
	);
});

test("the security headers reach every location", async ({ request }) => {
	// nginx's add_header does not merge across levels: a location with any add_header of
	// its own discards every inherited one, silently, with `nginx -t` still happy.
	// nginxConfig.test.ts reads the config; this reads the responses.
	const paths = ["/login", "/index.html", "/inject_env.json"];

	for (const path of paths) {
		const response = await request.get(path);
		expect(response.status(), path).toBeLessThan(400);

		const headers = response.headers();
		expect(headers, path).toHaveProperty("content-security-policy");
		expect(headers, path).toHaveProperty("x-content-type-options", "nosniff");
		expect(headers, path).toHaveProperty("referrer-policy");
		expect(headers, path).toHaveProperty("permissions-policy");
	}
});

test("a hashed asset is immutable and a missing one is a 404", async ({
	page,
	request,
}) => {
	const assets: string[] = [];
	page.on("response", (response) => {
		if (/\/assets\/.*\.js$/.test(response.url())) assets.push(response.url());
	});
	await page.goto("/login");
	await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
	expect(assets.length).toBeGreaterThan(0);

	const asset = await request.get(assets[0]);
	expect(asset.headers()["cache-control"]).toContain("immutable");
	expect(asset.headers()).toHaveProperty("content-security-policy");

	// A missing module must 404. Answering with index.html and a 200 makes the browser
	// parse HTML as a module and report "Unexpected token '<'" - a corrupt bundle rather
	// than an absent file.
	const missing = await request.get("/assets/does-not-exist-abcdef12.js");
	expect(missing.status()).toBe(404);
});

test("index.html is never cached", async ({ request }) => {
	// It is the only file naming the build's hashed chunks, and a redeploy replaces every
	// one of those names. A cached copy asks for files that are gone, and every lazy
	// route fails with "Failed to fetch dynamically imported module".
	const response = await request.get("/index.html");
	expect(response.headers()["cache-control"]).toContain("no-store");
});
