import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
	isInsightsEnabled,
	isAuditExplorerEnabled,
} from "@helpers/featureFlags";

// A flag is only useful if the environment can actually set it. featureFlags.ts reads
// from window.__APP_ENV__, which is rendered at container start by docker-entrypoint.sh
// from inject_env.template.json - and envsubst only substitutes the variables named in
// its argument list. A flag missing from either file is silently undefined in every
// deployed environment, so the feature it gates can never be switched on. That is not a
// hypothetical: VITE_FEATURE_INSIGHTS and VITE_FEATURE_AUDIT_EXPLORER both shipped that
// way. This test fails on the next one.

const repoFile = (relative: string) =>
	// vitest runs with the package root as cwd, which is where both docker/ and src/ live.
	readFileSync(path.resolve(process.cwd(), relative), "utf8");

const declaredFlags = (): string[] => {
	const source = repoFile("src/helpers/featureFlags.ts");
	const names = [...source.matchAll(/readFlag\(\s*"([A-Z0-9_]+)"\s*\)/g)].map(
		(m) => m[1],
	);

	// Guard the guard: a refactor that renames readFlag would otherwise make this
	// whole suite vacuously pass.
	expect(names.length).toBeGreaterThan(0);
	return names;
};

describe("runtime feature flags are wired through to deployment", () => {
	const template = repoFile("docker/production/inject_env.template.json");
	const entrypoint = repoFile("docker/production/docker-entrypoint.sh");

	it.each(declaredFlags())("%s is rendered into inject_env.json", (flag) => {
		expect(JSON.parse(template)).toHaveProperty(flag, `\${${flag}}`);
	});

	it.each(declaredFlags())("%s is in the envsubst variable list", (flag) => {
		const vars = entrypoint.match(/^vars='([^']*)'/m);
		expect(vars, "docker-entrypoint.sh has no vars='...' line").not.toBeNull();
		expect(vars![1]).toContain(`\${${flag}}`);
	});
});

describe("flags fail closed", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.unstubAllEnvs();
	});

	it("is off when the environment has never heard of the flag", () => {
		// The import.meta.env half has to be stubbed too, not just window. readFlag falls
		// back to import.meta.env for local development, and a developer's git-ignored
		// .env sets VITE_FEATURE_INSIGHTS=true - so this passed in CI, where no .env
		// exists, and failed on the machine of anyone who had one. A test whose result
		// depends on an untracked file is not a gate.
		vi.stubEnv("VITE_FEATURE_INSIGHTS", "");

		// envsubst renders an unset variable as the empty string, and a bundle built
		// without the var leaves it undefined - neither may read as enabled.
		for (const value of [undefined, "", "false", "FALSE", "0", "yes"]) {
			vi.stubGlobal("window", {
				__APP_ENV__: { VITE_FEATURE_INSIGHTS: value },
			});
			expect(isInsightsEnabled()).toBe(false);
		}
	});

	it("is on only for an explicit true", () => {
		vi.stubGlobal("window", {
			__APP_ENV__: {
				VITE_FEATURE_INSIGHTS: "true",
				VITE_FEATURE_AUDIT_EXPLORER: "TRUE",
			},
		});
		expect(isInsightsEnabled()).toBe(true);
		expect(isAuditExplorerEnabled()).toBe(true);
	});
});
