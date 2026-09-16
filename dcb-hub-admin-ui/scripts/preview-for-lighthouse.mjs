// The built app, served with just enough around it for Lighthouse to audit two pages.
//
// The sign-in page needs nothing: it is the shell, and measuring it with no backend is
// the right call. The Insights dashboard needs three things the shell does not - the
// feature flag, a session, and something to answer /insights/** - so this serves dist
// itself and injects them into index.html per request, rather than proxying vite preview.
//
// Injecting PER PATH is load-bearing. Seeding a session for every page would redirect
// /login to the dashboard, and the sign-in audit would quietly start measuring a
// different page while still reporting a number.
//
// Modelled on symposia-ui's scripts/preview-with-stub-api.mjs, including its two dist
// checks: Lighthouse's message for a wrong base is "The page did not paint any content
// (NO_FCP)", which reads as a broken application rather than a stale build.

import { createServer } from "node:http";
import { gzipSync } from "node:zlib";
import { existsSync, readFileSync } from "node:fs";
import { extname, join, normalize } from "node:path";

const PORT = 4193;
const DIST = "dist";

if (!existsSync(join(DIST, "index.html"))) {
	console.error("dist/index.html is missing - run `npm run build` first.");
	process.exit(1);
}

const wrongBase = /(?:src|href)="(\/(?!assets\/)[^"]*\/assets\/)/.exec(
	readFileSync(join(DIST, "index.html"), "utf8"),
);

if (wrongBase) {
	console.error(
		[
			`dist/ is built for base "${wrongBase[1].replace(/assets\/$/, "")}", not "/".`,
			"This server serves at the root, so every asset would 404 and Lighthouse would",
			"report NO_FCP - which reads as a broken app, not a stale build.",
			"`npm run e2e:ki-bootstrap` leaves dist in this state. Rebuild: npm run build",
		].join("\n"),
	);
	process.exit(1);
}

// The same identity the e2e build is compiled with. oidc-client-ts keys its store on
// `oidc.user:${authority}:${client_id}`, so these must match the build to the character
// or the seeded session is never found and the audit measures the sign-in page twice.
const KEYCLOAK_URL =
	process.env.VITE_KEYCLOAK_URL || "https://e2e-fake-keycloak.invalid/realms/dcb";
const KEYCLOAK_ID = process.env.VITE_KEYCLOAK_ID || "dcb-admin-e2e";

const RUNTIME_CONFIG = {
	VITE_MUI_X_LICENSE_KEY: "",
	VITE_KEYCLOAK_URL: KEYCLOAK_URL,
	VITE_KEYCLOAK_ID: KEYCLOAK_ID,
	VITE_DCB_API_BASE: `http://localhost:${PORT}/api`,
	VITE_FEATURE_INSIGHTS: "true",
};

const FAKE_USER = {
	id_token: "lighthouse-fake-id-token",
	session_state: "lighthouse-fake-session-state",
	access_token: "lighthouse-fake-access-token",
	token_type: "Bearer",
	scope: "openid profile email",
	profile: {
		sub: "lighthouse",
		email: "lighthouse@example.invalid",
		preferred_username: "lighthouse",
		roles: ["ADMIN", "CONSORTIUM_ADMIN"],
	},
	expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365,
};

/**
 * The four calls the dashboard makes before a scroll. Every panel below the fold mounts on
 * an IntersectionObserver, and Lighthouse does not scroll, so this is the landing cost -
 * which is the number the budget is about.
 *
 * Anything else 404s and is logged, exactly as the symposia-ui stub does: a new call on
 * the critical path should show up as a console error and redden best-practices, because
 * that is the gate noticing another round trip rather than a gap in this file.
 */
const INSIGHTS = {
	dashboard: {
		fulfillmentCurrent: { successfulCount: 812, failedCount: 96 },
		fulfillmentPrior: { successfulCount: 690, failedCount: 130 },
		turnaroundToLoaned: { p50Seconds: 187_200, p95Seconds: 540_000 },
		checkoutRate: { reachedCount: 744, totalCount: 908 },
		lendBorrowTotals: { borrowedCount: 908, suppliedCount: 1041 },
		savedByReResolution: 37,
		collectionSummary: { uniqueTitlesRequested: 763, totalRequests: 908 },
		supplierFulfillment: { successfulCount: 1002, failedCount: 39 },
		turnaroundToFinalised: { p50Seconds: 1_840_000, p95Seconds: 3_800_000 },
	},
	"fulfillment/supplier": { successfulCount: 1002, failedCount: 39 },
	turnaround: { p50Seconds: 1_840_000, p95Seconds: 3_800_000 },
	timeseries: Array.from({ length: 30 }, (_, day) => ({
		bucket: `2026-08-${String(day + 1).padStart(2, "0")}T00:00:00Z`,
		series: "LOANED",
		count: 20 + (day % 7),
	})),
};

const CONTENT_TYPES = {
	".html": "text/html; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".svg": "image/svg+xml",
	".png": "image/png",
	".ico": "image/x-icon",
	".woff2": "font/woff2",
};

/** The shell always needs the config; only the dashboard needs a session. */
const bootScript = (authenticated) =>
	[
		"<script>",
		`window.__APP_ENV__ = ${JSON.stringify(RUNTIME_CONFIG)};`,
		authenticated
			? `try { localStorage.setItem(${JSON.stringify(
					`oidc.user:${KEYCLOAK_URL}:${KEYCLOAK_ID}`,
				)}, ${JSON.stringify(JSON.stringify(FAKE_USER))}); } catch (e) {}`
			: "",
		"</script>",
	].join("\n");

// Read per request, never cached. A server started before the build lhci runs would
// otherwise serve the previous build's index.html, whose chunk hashes no longer exist -
// and a module that 404s into the SPA fallback arrives as text/html, which Chrome refuses
// and Lighthouse reports as NO_FCP: "the page did not paint any content".
const shell = (authenticated) =>
	readFileSync(join(DIST, "index.html"), "utf8").replace(
		"<head>",
		`<head>
${bootScript(authenticated)}`,
	);

/**
 * COMPRESS, because `vite preview` does and total-byte-weight counts transfer bytes.
 *
 * Serving uncompressed measured the sign-in page at 1,628,825 B against a budget of
 * 750,000 B set from a `vite preview` run - a 2.2x "regression" that was entirely this
 * server. The same trap the 2.0 review recorded for nginx: a gate is only comparable to
 * its baseline if the thing in front of it behaves the same way.
 */
const send = (request, response, body, type) => {
	const accepts = String(request.headers["accept-encoding"] ?? "").includes("gzip");
	const buffer = Buffer.isBuffer(body) ? body : Buffer.from(body);

	if (!accepts || buffer.length < 1024) {
		response.writeHead(200, { "content-type": type });
		response.end(buffer);
		return;
	}

	const gzipped = gzipSync(buffer);
	response.writeHead(200, { "content-type": type, "content-encoding": "gzip" });
	response.end(gzipped);
};

const json = (response, body, status = 200) => {
	response.writeHead(status, { "content-type": "application/json" });
	response.end(JSON.stringify(body));
};

const server = createServer((request, response) => {
	const path = new URL(request.url, `http://localhost:${PORT}`).pathname;

	if (path.startsWith("/api/insights/")) {
		const key = path.slice("/api/insights/".length);
		const match = Object.keys(INSIGHTS)
			.filter((candidate) => key === candidate || key.startsWith(`${candidate}/`))
			.sort((a, b) => b.length - a.length)[0];

		if (!match) {
			console.error(`stub api: unexpected call to ${path}`);
			json(response, {}, 404);
			return;
		}

		json(response, INSIGHTS[match]);
		return;
	}

	// The scope selector asks for the library list. An empty page is the honest answer
	// for a deployment with none onboarded, and it keeps the audit off a fixture's size.
	if (path.startsWith("/api/graphql")) {
		json(response, { data: { libraries: { content: [], totalSize: 0 } } });
		return;
	}

	const asset = normalize(join(DIST, path));

	if (path !== "/" && asset.startsWith(DIST) && existsSync(asset)) {
		const type = CONTENT_TYPES[extname(asset)] ?? "application/octet-stream";
		send(request, response, readFileSync(asset), type);
		return;
	}

	send(request, response, shell(path !== "/login"), CONTENT_TYPES[".html"]);
});

server.listen(PORT, "127.0.0.1", () => {
	console.log(`lighthouse preview on http://localhost:${PORT}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
	process.on(signal, () => server.close(() => process.exit(0)));
}
