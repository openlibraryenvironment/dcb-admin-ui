import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
	isAnnouncementsEnabled,
	isConsortiumBrandingEnabled,
	isInsightsEnabled,
	isAuditExplorerEnabled,
	isShelfBrowseEnabled,
	isSymposiaEnabled,
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

describe("runtime config is wired through to deployment", () => {
	// The flag tests above start from featureFlags.ts, so they only ever see keys read
	// through readFlag(). VITE_DCB_ADMIN_FOR_LIBRARIES_URL is runtime config that is not
	// a flag, and it was in neither file: unauthorised.tsx read it, no deployment could
	// set it, and the "you want the other application" button was dead everywhere except
	// npm run dev. These two assertions cover every key, flag or not.
	const template = repoFile("docker/production/inject_env.template.json");
	const entrypoint = repoFile("docker/production/docker-entrypoint.sh");

	const envsubstVars = (): string[] => {
		const vars = entrypoint.match(/^vars='([^']*)'/m);
		expect(vars, "docker-entrypoint.sh has no vars='...' line").not.toBeNull();
		return [...vars![1].matchAll(/\$\{([A-Z0-9_]+)\}/g)].map((m) => m[1]);
	};

	it("names the same keys in the template and the envsubst list", () => {
		// A key in only one of them fails in a way nothing else catches: envsubst leaves
		// an unlisted placeholder as the literal "${VITE_X}", so the app reads that
		// string as a configured value.
		expect(envsubstVars().sort()).toEqual(
			Object.keys(JSON.parse(template)).sort(),
		);
	});

	it("gives every template key its own placeholder", () => {
		// "${VITE_A}" sitting under key VITE_B renders A's value under B's name, which
		// looks configured and is wrong - a copy-paste away in a file of 14 near-identical
		// lines.
		for (const [key, value] of Object.entries(JSON.parse(template))) {
			expect(value, `${key} is rendered from the wrong variable`).toBe(
				`\${${key}}`,
			);
		}
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

describe("the surfaces Symposia gates", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.unstubAllEnvs();
	});

	const withFlags = (flags: Record<string, string>) => {
		for (const name of [
			"VITE_FEATURE_SYMPOSIA",
			"VITE_FEATURE_ANNOUNCEMENTS",
			"VITE_FEATURE_SHELF_BROWSE",
			"VITE_FEATURE_CONSORTIUM_BRANDING",
		]) {
			// Same reason as the block above: a developer's .env must not decide this.
			vi.stubEnv(name, "");
		}

		vi.stubGlobal("window", { __APP_ENV__: flags });
	};

	// Announcements are read in the discovery front end, and a shelf classification exists
	// to order a shelf browse there. A consortium running no discovery product has no use
	// for either, however new its dcb-service is.
	it("keeps them off with their own flag on but Symposia absent", () => {
		withFlags({
			VITE_FEATURE_ANNOUNCEMENTS: "true",
			VITE_FEATURE_SHELF_BROWSE: "true",
		});

		expect(isSymposiaEnabled()).toBe(false);
		expect(isAnnouncementsEnabled()).toBe(false);
		expect(isShelfBrowseEnabled()).toBe(false);
	});

	// Each still needs its own flag: dcb-service declares neither field on any release, and
	// asking for one it does not declare fails the whole operation rather than returning
	// null. Symposia is a second condition, not a replacement.
	it("keeps them off with Symposia on but their own flag absent", () => {
		withFlags({ VITE_FEATURE_SYMPOSIA: "true" });

		expect(isAnnouncementsEnabled()).toBe(false);
		expect(isShelfBrowseEnabled()).toBe(false);
	});

	it("turns them on when both are set", () => {
		withFlags({
			VITE_FEATURE_SYMPOSIA: "true",
			VITE_FEATURE_ANNOUNCEMENTS: "true",
			VITE_FEATURE_SHELF_BROWSE: "true",
		});

		expect(isAnnouncementsEnabled()).toBe(true);
		expect(isShelfBrowseEnabled()).toBe(true);
	});

	// Branding is NOT gated: the logo and header icon are what DCB Admin puts in its own
	// app bar, so the capability stays on and only its patron-facing fields are hidden.
	it("leaves consortium branding alone", () => {
		withFlags({ VITE_FEATURE_CONSORTIUM_BRANDING: "true" });

		expect(isConsortiumBrandingEnabled()).toBe(true);
	});
});
