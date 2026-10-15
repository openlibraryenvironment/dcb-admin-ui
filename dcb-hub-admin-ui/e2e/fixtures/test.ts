import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test as base, expect } from "@playwright/test";
import { E2E_KEYCLOAK_URL } from "./keycloak";

// Read from the file nginx ships, so the policy every test runs under is production's
const CONTENT_SECURITY_POLICY = (() => {
	const conf = readFileSync(
		join("docker", "production", "security-headers.conf"),
		"utf8",
	);
	const policy = conf.match(
		/add_header Content-Security-Policy "([^"]+)"/,
	)?.[1];
	if (!policy)
		throw new Error(
			"No Content-Security-Policy in docker/production/security-headers.conf",
		);
	return policy;
})();

export type CspViolation = { directive: string; blocked: string };

/** What the application's missingKeyHandler records - src/helpers/i18nMissingKeys.ts. */
type MissingKey = { language: string; namespace: string; key: string };
const PIXEL_PNG = Buffer.from(
	"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
	"base64",
);

type WithCollector = Window & {
	__I18N_MISSING__?: MissingKey[];
	__e2eMissingKey?: (entry: MissingKey) => Promise<void>;
};

/**
 * Every test fails if anything it opened rendered a translation key the catalogue does
 * not carry. e2e/i18n-missing.spec.ts covers each route's first render; this covers the
 * dialogs, errors and validation a journey reaches. docs/i18n.md.
 */
export const test = base.extend<{
	missingTranslations: void;
	unresolvedHosts: void;
	cspViolations: CspViolation[];
}>({
	// Every test fails if a page it opened broke production's Content Security Policy.
	// The application's own documents are served with it; a violation is neither a
	// failed request nor an exception, so nothing else here would see one.
	cspViolations: [
		async ({ context, baseURL }, use) => {
			const violations: CspViolation[] = [];
			await context.route(
				(url) => !!baseURL && url.href.startsWith(baseURL),
				async (route) => {
					if (route.request().resourceType() !== "document")
						return route.fallback();
					const response = await route.fetch();
					await route.fulfill({
						response,
						headers: {
							...response.headers(),
							"content-security-policy": CONTENT_SECURITY_POLICY,
						},
					});
				},
			);
			await context.exposeBinding(
				"__e2eCspViolation",
				(_source, violation: CspViolation) => {
					violations.push(violation);
				},
			);
			// Installed before the document's own scripts, which is when most would fire
			await context.addInitScript(() => {
				document.addEventListener("securitypolicyviolation", (event) => {
					void (
						window as unknown as {
							__e2eCspViolation?: (v: CspViolation) => Promise<void>;
						}
					).__e2eCspViolation?.({
						directive: event.violatedDirective,
						blocked: String(event.blockedURI).slice(0, 200),
					});
				});
			});

			await use(violations);

			expect(
				violations,
				"A page broke the Content Security Policy production sends. docs/testing.md",
			).toEqual([]);
		},
		{ auto: true },
	],
	// Every test fails if a request it made went to DNS for a host that cannot resolve:
	// whether that fails fast or stalls is this machine's network, not the application.
	unresolvedHosts: [
		async ({ context }, use) => {
			// The environment pages check Keycloak's health on load
			await context.route(
				`${new URL(E2E_KEYCLOAK_URL).origin}/health`,
				(route) =>
					route.fulfill({
						json: { status: "UP", checks: [{ name: "e2e", status: "UP" }] },
					}),
			);
			// Fixture brand images (header icons, logos) are placeholders on .invalid hosts
			await context.route(
				(url) =>
					url.hostname.endsWith(".invalid") &&
					/\.(png|jpe?g|gif|svg|webp)$/i.test(url.pathname),
				(route) => route.fulfill({ contentType: "image/png", body: PIXEL_PNG }),
			);
			const unresolved: string[] = [];
			context.on("requestfailed", (request) => {
				if (request.failure()?.errorText === "net::ERR_NAME_NOT_RESOLVED")
					unresolved.push(request.url());
			});

			await use();

			expect(
				unresolved,
				"A request went to DNS for a host that cannot resolve. Mock it in e2e/fixtures.",
			).toEqual([]);
		},
		{ auto: true },
	],

	missingTranslations: [
		async ({ context }, use) => {
			const recorded: MissingKey[] = [];
			await context.exposeBinding(
				"__e2eMissingKey",
				(_source, entry: MissingKey) => {
					recorded.push(entry);
				},
			);
			// The collector lives on window, which every navigation replaces, so push is
			// wrapped as the application assigns the array. The array is never created here:
			// its presence is what i18n-missing.spec.ts reads as "the collector is armed".
			await context.addInitScript(() => {
				const w = window as WithCollector;
				let store: MissingKey[] | undefined;
				Object.defineProperty(w, "__I18N_MISSING__", {
					configurable: true,
					get: () => store,
					set(value: MissingKey[]) {
						const push = value.push.bind(value);
						value.push = (...entries: MissingKey[]) => {
							for (const entry of entries) void w.__e2eMissingKey?.(entry);
							return push(...entries);
						};
						store = value;
					},
				});
			});

			await use();

			// A binding call still in flight at teardown is in the open page's array too
			for (const page of context.pages()) {
				if (page.isClosed()) continue;
				const onPage = await page
					.evaluate(() => (window as WithCollector).__I18N_MISSING__ ?? [])
					.catch(() => []);
				recorded.push(...onPage);
			}
			const unique = [
				...new Map(
					recorded.map((r) => [`${r.language}|${r.namespace}|${r.key}`, r]),
				).values(),
			];
			expect(
				unique,
				"Rendered a translation key the catalogue does not carry - a user sees the raw key. docs/i18n.md",
			).toEqual([]);
		},
		{ auto: true },
	],
});

export { expect };
