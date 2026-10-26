import { test, expect } from "./fixtures/test";
import { proves } from "./fixtures/coverage";

/**
 * The fixture's collector has to fire, or every clean run means nothing: a policy that is
 * not applied and a page that keeps it look the same. This does the one thing
 * `script-src 'self'` must refuse.
 */
test(
	"the policy is applied, and the collector sees what it refuses",
	proves(
		"The shipped Content Security Policy is applied in the browser tests, and a page it blocks something on fails them.",
		["SEC-03"],
	),
	async ({ page, cspViolations }) => {
		await page.goto("/login");

		await page.evaluate(() => {
			const script = document.createElement("script");
			script.textContent = "window.__inlineRan = true;";
			document.head.appendChild(script);
		});

		await expect.poll(() => cspViolations.length).toBeGreaterThan(0);
		// CSP Level 3 reports the effective directive, so an inline <script> element can be
		// named under script-src-elem although the policy only says script-src
		expect(cspViolations.map((v) => v.directive)).toEqual(
			expect.arrayContaining([expect.stringMatching(/^script-src(-elem)?$/)]),
		);
		expect(
			await page.evaluate(
				() => (window as unknown as { __inlineRan?: boolean }).__inlineRan,
			),
		).toBeUndefined();

		// Raised on purpose; the fixture fails any other test that leaves one behind
		cspViolations.length = 0;
	},
);
