import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import { SERVICE_CAPABILITIES } from "@constants/serviceCapabilities";

/**
 * `.env.example` against the capability registry.
 *
 * SERVICE_CAPABILITIES is the source of truth; this asserts the template agrees with it
 * on both the flag names and their version thresholds, so adding a capability without
 * documenting it fails here. What the flags are for: docs/deployment.md §2a.
 */

const ENV_EXAMPLE = readFileSync(
	path.resolve(__dirname, "../../.env.example"),
	"utf8",
);

/** Every `NAME=` assignment in the template, in file order. */
const assignments = [...ENV_EXAMPLE.matchAll(/^([A-Z0-9_]+)=/gm)].map(
	(match) => match[1],
);

/**
 * The one flag with no capability row, by design: it says what the consortium runs, not
 * what the server serves, so it has no version threshold.
 */
const FLAG_WITHOUT_A_CAPABILITY = "VITE_FEATURE_SYMPOSIA";

describe(".env.example", () => {
	it("documents every capability flag the code reads", () => {
		const documented = assignments.filter((name) =>
			name.startsWith("VITE_FEATURE_"),
		);
		const expected = [
			...SERVICE_CAPABILITIES.map((entry) => entry.flag),
			FLAG_WITHOUT_A_CAPABILITY,
		];

		expect([...documented].sort()).toEqual([...expected].sort());
	});

	it("states each flag's threshold as the registry has it", () => {
		for (const { flag, since } of SERVICE_CAPABILITIES) {
			// The comment block introducing this flag: everything after the previous
			// assignment and before this one.
			const at = ENV_EXAMPLE.indexOf(`\n${flag}=`);
			expect(at, `${flag} is not assigned in .env.example`).toBeGreaterThan(-1);
			const preceding = ENV_EXAMPLE.slice(0, at);
			const block = preceding.slice(preceding.lastIndexOf("\n\n"));

			if (since === null) {
				expect(
					block,
					`${flag} is on no release, so its comment must say "unreleased"`,
				).toContain("unreleased");
			} else {
				expect(
					block,
					`${flag} is since ${since}, which its comment must name`,
				).toContain(`since ${since}`);
			}
		}
	});

	it("marks every flag that changes a document as one", () => {
		// Getting a document-gating flag wrong fails the whole operation rather than
		// hiding a control, which is the distinction a reader needs before flipping one.
		for (const { flag, fields } of SERVICE_CAPABILITIES) {
			if (Object.keys(fields).length === 0) continue;
			const at = ENV_EXAMPLE.indexOf(`\n${flag}=`);
			const preceding = ENV_EXAMPLE.slice(0, at);
			const block = preceding.slice(preceding.lastIndexOf("\n\n"));

			expect(
				block,
				`${flag} selects fields (${Object.keys(fields).join(", ")}), so its comment must say "document"`,
			).toContain("document");
		}
	});

	it("names the flag whose OFF state sends deleted fields", () => {
		// Unique, and the reason this file was written: consortium_branding is the only
		// capability with a `fallback`, so it is the only one where leaving the flag unset
		// actively asks a modern dcb-service for columns a migration dropped.
		const withFallback = SERVICE_CAPABILITIES.filter(
			(entry) => entry.fallback !== undefined,
		);
		expect(withFallback.map((entry) => entry.id)).toEqual([
			"consortium_branding",
		]);

		const at = ENV_EXAMPLE.indexOf("\nVITE_FEATURE_CONSORTIUM_BRANDING=");
		const preceding = ENV_EXAMPLE.slice(0, at);
		const block = preceding.slice(preceding.lastIndexOf("\n\n"));
		expect(block).toContain("headerImageUrl");
	});

	it("documents every non-flag variable the runtime config carries", () => {
		// The deployed template is the full set of keys an environment can supply; a
		// developer copying .env.example should not have to read a Dockerfile to find one.
		const deployed = readFileSync(
			path.resolve(
				__dirname,
				"../../docker/production/inject_env.template.json",
			),
			"utf8",
		);
		const deployedKeys = [
			...new Set(
				[...deployed.matchAll(/"(VITE_[A-Z0-9_]+)"\s*:/g)].map((m) => m[1]),
			),
		];

		const missing = deployedKeys.filter((key) => !assignments.includes(key));
		expect(
			missing,
			`undocumented in .env.example: ${missing.join(", ")}`,
		).toEqual([]);
	});
});
