import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

/**
 * The container's nginx config, checked for the one thing that will actually go wrong.
 *
 * <h2>Why a test and not a review comment</h2>
 *
 * nginx's `add_header` does not merge across levels. A `location` block containing any
 * `add_header` of its own DISCARDS every `add_header` inherited from the enclosing server
 * block — silently, with no warning from `nginx -t`, which reports this config as
 * perfectly valid.
 *
 * So the way the security headers get lost is not somebody deleting them. It is somebody
 * adding a location — a new `/api/` proxy, a `/health` endpoint, a cache rule for
 * `/locales/` — with a Cache-Control on it, and thereby turning the headers off for that
 * path without touching the file that declares them. That is invisible in review and
 * invisible in the config, and only shows up in a response header nobody is looking at.
 *
 * This asserts the invariant instead: every location includes the headers, and the one
 * that includes the relaxed variant is the one file that is allowed it.
 *
 * A response-level check against the built image would be stronger and is the right thing
 * to add when CI gains a docker build step. It was run by hand for this change — every
 * location returned the four headers, /silent-renew.html returned the relaxed CSP, and a
 * missing asset returned 404 rather than HTML.
 */
const nginxConf = readFileSync(
	resolve(__dirname, "../../docker/production/nginx.conf"),
	"utf8",
);

/** The Content-Security-Policy value a headers file actually emits, comments excluded. */
function policy(file: string): string {
	const conf = readFileSync(
		resolve(__dirname, "../../docker/production", file),
		"utf8",
	);
	const directive = conf
		.split("\n")
		.find((line) => line.startsWith("add_header Content-Security-Policy"));

	if (!directive) {
		throw new Error(`no Content-Security-Policy directive in ${file}`);
	}

	return directive;
}

const HEADERS_INCLUDE = "include /etc/nginx/security-headers.conf;";
const SILENT_RENEW_INCLUDE =
	"include /etc/nginx/security-headers-silent-renew.conf;";

/** Every `location … { … }` block, with its matcher and its body. */
function locationBlocks(): { matcher: string; body: string }[] {
	const blocks: { matcher: string; body: string }[] = [];
	// Anchored to the start of a line. Unanchored, `location` matches the word inside a
	// comment and then swallows everything up to the next brace as the "matcher" - which
	// is what the first version of this test did, and it reported a passing config as
	// broken rather than the other way round.
	const opener = /^[ \t]*location\s+([^{\n]+?)\s*\{/gm;

	let match: RegExpExecArray | null;
	while ((match = opener.exec(nginxConf)) !== null) {
		// Walk braces from the opening one so a nested block cannot end the match early.
		let depth = 1;
		let i = opener.lastIndex;
		while (i < nginxConf.length && depth > 0) {
			if (nginxConf[i] === "{") depth++;
			else if (nginxConf[i] === "}") depth--;
			i++;
		}
		blocks.push({
			matcher: match[1].trim(),
			body: nginxConf.slice(opener.lastIndex, i - 1),
		});
	}

	return blocks;
}

describe("the container's security headers", () => {
	it("finds the location blocks it is meant to be checking", () => {
		// Guards the test itself: a regex that silently matches nothing would make every
		// assertion below vacuously true.
		const matchers = locationBlocks().map((block) => block.matcher);
		expect(matchers).toEqual([
			"= /inject_env.json",
			"= /index.html",
			"/assets/",
			"= /silent-renew.html",
			"/",
		]);
	});

	it("declares them at server level", () => {
		expect(nginxConf).toContain(HEADERS_INCLUDE);
	});

	it("re-includes them in EVERY location, because nginx does not inherit them", () => {
		const missing = locationBlocks()
			.filter(
				(block) =>
					!block.body.includes(HEADERS_INCLUDE) &&
					!block.body.includes(SILENT_RENEW_INCLUDE),
			)
			.map((block) => block.matcher);

		expect(missing).toEqual([]);
	});

	it("relaxes script-src for exactly one location", () => {
		const relaxed = locationBlocks()
			.filter((block) => block.body.includes(SILENT_RENEW_INCLUDE))
			.map((block) => block.matcher);

		// public/silent-renew.html carries an inline script it cannot avoid — it is served
		// verbatim and cannot import oidc-client-ts. Any OTHER location appearing here is
		// a hole, not an exception.
		expect(relaxed).toEqual(["= /silent-renew.html"]);
	});

	it("frames only itself, and does not reach for 'none'", () => {
		// The DIRECTIVE, not the file: both of these files explain in prose why 'none' is
		// wrong, so a whole-file assertion trips on its own comment.
		const csp = policy("security-headers.conf");

		// 'none' is the reflex answer and it breaks authentication: oidc-client-ts renews
		// the session in a hidden iframe pointed at this origin's own silent-renew.html,
		// and frame-ancestors 'none' blocks same-origin framing too. Users would be signed
		// out whenever their token expired.
		expect(csp).toContain("frame-ancestors 'self'");
		expect(csp).not.toContain("frame-ancestors 'none'");
	});

	it("keeps script-src strict everywhere else", () => {
		expect(policy("security-headers.conf")).toContain("script-src 'self';");
		expect(policy("security-headers.conf")).not.toContain(
			"script-src 'self' 'unsafe-inline'",
		);
		// And confirms the exception really is one, rather than the same policy twice.
		expect(policy("security-headers-silent-renew.conf")).toContain(
			"script-src 'self' 'unsafe-inline'",
		);
	});
});

describe("the container's compression", () => {
	it("turns gzip on, because the base image does not", () => {
		// nginx:stable-alpine ships gzip commented out in its http block and this image
		// replaces only conf.d/default.conf. Without this the container served 1,576 KB
		// where Cloudflare and `vite preview` both serve 665 KB - 2.4x the payload, on the
		// one hosting path the Lighthouse budget never measures.
		expect(nginxConf).toMatch(/^\s*gzip on;/m);
		expect(nginxConf).toMatch(/^\s*gzip_vary on;/m);
	});

	it("compresses the types this application actually serves", () => {
		for (const type of [
			"application/javascript",
			"text/css",
			"application/json",
			"image/svg+xml",
		]) {
			expect(nginxConf).toContain(type);
		}
	});

	it("does not waste CPU on already-compressed fonts", () => {
		expect(nginxConf).not.toContain("font/woff2");
	});
});
