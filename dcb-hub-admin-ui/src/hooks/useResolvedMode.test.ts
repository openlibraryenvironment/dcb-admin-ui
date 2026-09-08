import { describe, it, expect, afterEach, vi } from "vitest";

import { readSystemMode } from "./useResolvedMode";

/**
 * `useResolvedMode` itself is a hook and this repo has no React test renderer - the
 * component-level behaviour is covered by the Playwright specs. What is testable here is
 * the part that carries the judgement: which media query wins.
 */
const withMedia = (matches: Record<string, boolean>) =>
	vi.stubGlobal("window", {
		matchMedia: (query: string) => ({ matches: matches[query] === true }),
	});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("reading the mode the operating system is asking for", () => {
	it("prefers contrast over the colour scheme", () => {
		// The judgement this encodes: asking the OS for more contrast is an
		// ACCESSIBILITY request, and answering it with dark mode because the user also
		// asked for dark would be answering the smaller of the two. This application has
		// a high-contrast theme and never offered it to the people who had already said
		// they needed one.
		withMedia({
			"(prefers-contrast: more)": true,
			"(prefers-color-scheme: dark)": true,
		});

		expect(readSystemMode()).toBe("highContrast");
	});

	it("follows the colour scheme when contrast is not asked for", () => {
		withMedia({ "(prefers-color-scheme: dark)": true });
		expect(readSystemMode()).toBe("dark");

		withMedia({});
		expect(readSystemMode()).toBe("light");
	});

	it("falls back to light where matchMedia does not exist", () => {
		// Not hypothetical here: this module is imported by tests and tooling that run
		// with no DOM at all, and a throw at import time would take the whole app down.
		vi.stubGlobal("window", {});
		expect(readSystemMode()).toBe("light");
	});
});
