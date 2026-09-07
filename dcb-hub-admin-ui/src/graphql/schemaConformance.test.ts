import { describe, expect, it, afterEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { buildSchema, parse, validate } from "graphql";

import {
	SERVICE_CAPABILITIES,
	meetsServiceVersion,
} from "@constants/serviceCapabilities";

/**
 * Every document this application can emit must be valid against the dcb-service it
 * will be sent to — R-19.
 *
 * <h2>What this catches, and why prose could not</h2>
 *
 * A GraphQL field the server has never heard of is NOT a null. It is a validation
 * error, and it fails the whole operation. So one field selected a release too early
 * does not degrade a panel - it takes down every route that runs the query. That is
 * exactly what happened with the merged brand columns: LoadConsortium is fetched in
 * three route loaders and LoadConsortiumHeader runs on every page, so against 8.71.0
 * the setup wizard, the consortium section and the header all went at once.
 *
 * A note in a CLAUDE.md saying "remember to flag v9-only fields" prevents none of it.
 * This does, on the next one as well as this one, in milliseconds and with no server.
 *
 * <h2>The two schemas</h2>
 *
 * <h2>The three schemas</h2>
 *
 * `schema.graphqls` is what the application targets: dcb-service main plus the
 * unreleased `auditIncidence` - see that file's own header. `schema.v8.71.0.graphqls` is
 * the release before 9.0.0, taken verbatim from that tag, which the next DCB Admin
 * release also has to run against while v9 works its way to production.
 *
 * `schema.v9.0.0.graphqls` is the middle case and it is the one that was missing. A
 * deployment on the 9.0.0 RELEASE has the brand columns and does not have `supportUrl` or
 * `maxLocalHolds`, which are on main only. Neither of the other two passes can catch a
 * field gated at the wrong threshold: all-flags-on validates against a schema that has
 * everything, and all-flags-off validates against one that has nothing.
 *
 * Both passes run the SAME documents, with the feature flags in the state that
 * deployment would have. The flags change the documents themselves - see
 * @fragments/consortiumBrand - which is why the flag state has to be set before the
 * document is built and not merely before it is rendered.
 */

const repoRoot = process.cwd();

const schemaFrom = (file: string) =>
	buildSchema(readFileSync(path.resolve(repoRoot, file), "utf8"));

const CURRENT = schemaFrom("schema.graphqls");
const RELEASE_9 = schemaFrom("schema.v9.0.0.graphqls");
const LEGACY = schemaFrom("schema.v8.71.0.graphqls");

/**
 * Documents that are only ever sent when a flag is on, with the flag that sends them.
 *
 * They are EXCLUDED from the legacy pass, not skipped: excluding a document here is a
 * claim that a route guard stops it being emitted on an older deployment, and the
 * claim is reviewable because the flag is named next to it. A silent skip would be a
 * hole in the gate; this is a documented door.
 */
const FLAG_ONLY: Record<string, string> = {
	"queries/getAuditIncidence.ts": "VITE_FEATURE_AUDIT_EXPLORER",
	"queries/getLibraryUsers.ts": "VITE_FEATURE_LIBRARY_USER_PROVISIONING",
	"mutations/provisionLibraryUser.ts": "VITE_FEATURE_LIBRARY_USER_PROVISIONING",
};

/**
 * Every declared flag on, so the "current" pass exercises the widest document set the
 * application can produce.
 *
 * DERIVED from the registry, not listed. It was listed, and it had drifted: neither
 * VITE_FEATURE_LOCAL_HOLDS nor VITE_FEATURE_CONSORTIUM_SUPPORT_URL was here, so the two
 * selections they gate were validated against nothing at all - the widest pass was
 * quietly running them in legacy mode. A hand-maintained copy of a list that already
 * exists is how a gate stops covering the thing it was added for.
 */
const flagsFor = (capabilities: readonly { flag: string }[]) =>
	Object.fromEntries(capabilities.map((entry) => [entry.flag, "true"]));

const ALL_FLAGS_ON = flagsFor(SERVICE_CAPABILITIES);

/**
 * The flags a deployment on the 9.0.0 RELEASE would have: every capability that release
 * actually serves, and none that landed after it.
 *
 * `meetsServiceVersion("9.0.0", null)` is false, so a capability with no release - which
 * is what `since: null` means - is off here. That is the claim under test.
 */
const RELEASE_9_CAPABILITIES = SERVICE_CAPABILITIES.filter(
	(entry) => meetsServiceVersion("9.0.0", entry.since) === true,
);

const RELEASE_9_FLAGS = flagsFor(RELEASE_9_CAPABILITIES);

// Fragments are excluded: they are interpolated into the queries below, which is where
// they get validated. A fragment definition on its own fails NoUnusedFragments.
const modules = import.meta.glob("./{queries,mutations}/*.ts");

/** `./queries/getConsortia.ts` -> `queries/getConsortia.ts`. */
const shortName = (file: string) => file.replace(/^\.\//, "");

/**
 * Every document a module exports.
 *
 * Three shapes exist in this codebase: a plain `gql` string, and - since the brand
 * columns split across two dcb-service versions - a zero-argument builder that reads a
 * flag when it is called. Both are collected, so converting a constant into a builder
 * cannot quietly drop it out of this gate.
 */
const documentsFrom = (mod: Record<string, unknown>): string[] =>
	Object.values(mod).flatMap((value) => {
		if (typeof value === "string") return [value];
		if (typeof value === "function" && value.length === 0) {
			const built = (value as () => unknown)();
			return typeof built === "string" ? [built] : [];
		}
		return [];
	});

const assertValid = (
	document: string,
	schema: typeof CURRENT,
	where: string,
) => {
	const errors = validate(schema, parse(document));

	expect(
		errors.map((error) => error.message),
		`${where}\n${document}`,
	).toEqual([]);
};

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("documents validate against the dcb-service they target", () => {
	const files = Object.keys(modules).sort();

	// Guard the guard. A refactor that moves src/graphql/ or renames the folders would
	// otherwise leave a suite that passes because it tests nothing at all.
	it("finds the documents", () => {
		expect(files.length).toBeGreaterThan(50);
	});

	it.each(files)(
		"%s is valid against the target schema (all flags on)",
		async (file) => {
			vi.stubGlobal("window", { __APP_ENV__: ALL_FLAGS_ON });

			const documents = documentsFrom(
				(await modules[file]()) as Record<string, unknown>,
			);
			expect(documents.length).toBeGreaterThan(0);
			documents.forEach((document) =>
				assertValid(document, CURRENT, `${file} against schema.graphqls`),
			);
		},
	);

	it.each(files.filter((file) => !FLAG_ONLY[shortName(file)]))(
		"%s is valid against dcb-service 8.71.0 (all flags off)",
		async (file) => {
			// No window at all: envsubst renders an unset flag as the empty string and a
			// bundle built without one leaves it undefined. readFlag reads both as false,
			// which is the state of an environment that has never heard of the flag.
			vi.stubGlobal("window", undefined);

			const documents = documentsFrom(
				(await modules[file]()) as Record<string, unknown>,
			);
			expect(documents.length).toBeGreaterThan(0);
			documents.forEach((document) =>
				assertValid(
					document,
					LEGACY,
					`${file} against schema.v8.71.0.graphqls`,
				),
			);
		},
	);

	it.each(
		files.filter((file) => {
			const gate = FLAG_ONLY[shortName(file)];
			return !gate || gate in RELEASE_9_FLAGS;
		}),
	)(
		"%s is valid against dcb-service 9.0.0 (the release's flags)",
		async (file) => {
			vi.stubGlobal("window", { __APP_ENV__: RELEASE_9_FLAGS });

			const documents = documentsFrom(
				(await modules[file]()) as Record<string, unknown>,
			);
			expect(documents.length).toBeGreaterThan(0);
			documents.forEach((document) =>
				assertValid(
					document,
					RELEASE_9,
					`${file} against schema.v9.0.0.graphqls`,
				),
			);
		},
	);

	it("the 9.0.0 pass is not vacuous", () => {
		// It would be if every capability were `since: null`, or if meetsServiceVersion
		// started returning null for a release we hold a schema for.
		expect(RELEASE_9_CAPABILITIES.length).toBeGreaterThan(0);
		expect(RELEASE_9_CAPABILITIES.length).toBeLessThan(
			SERVICE_CAPABILITIES.length,
		);
	});

	it("every flag-only exclusion names a flag that exists", () => {
		const declared = readFileSync(
			path.resolve(repoRoot, "src/helpers/featureFlags.ts"),
			"utf8",
		);

		for (const [file, flag] of Object.entries(FLAG_ONLY)) {
			expect(declared, `${file} is excluded on ${flag}`).toContain(
				`readFlag("${flag}")`,
			);
		}
	});
});
