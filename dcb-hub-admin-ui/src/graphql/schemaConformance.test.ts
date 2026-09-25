import { describe, expect, it, afterEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { buildSchema, parse, validate } from "graphql";

import {
	DEPLOYMENT_FLAGS,
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
 * <h2>The schemas</h2>
 *
 * `schema.graphqls` is what the application targets - see that file's own header.
 * `schema.v8.71.0.graphqls` is the oldest deployment we support, taken verbatim from that
 * tag, which DCB Admin has to keep running against while v9 works its way to production.
 *
 * Between them sit the release schemas, one pass each. They are the cases neither end can
 * catch: all-flags-on validates against a schema that has everything and all-flags-off
 * against one that has nothing, so a field gated at the wrong THRESHOLD is invisible to
 * both. 9.0.0 has the brand columns and not `maxLocalHolds`; 9.1.0 has `maxLocalHolds`
 * and the provisioning API and not `supportUrl`. 9.0.0 is kept although nothing deploys
 * it, because it is the release `consortium_branding` names.
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
	// V-12. dcb-service declares none of these on any release, so a deployment on 8.71.0 or
	// the 9.0.0 tag must never see one — which is what the two narrower passes would
	// otherwise, correctly, fail on.
	"queries/getAnnouncements.ts": "VITE_FEATURE_ANNOUNCEMENTS",
	"mutations/announcements.ts": "VITE_FEATURE_ANNOUNCEMENTS",
	// N-3 / V-22.6. Same argument as the two above, and a SEPARATE flag: the scoped
	// settings and the announcements land on the same branch but need not land in the
	// same release.
	"queries/getResolvedFunctionalSettings.ts":
		"VITE_FEATURE_SETTINGS_INHERITANCE",
	"mutations/functionalSettingScopes.ts": "VITE_FEATURE_SETTINGS_INHERITANCE",
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

const ALL_FLAGS_ON = {
	...flagsFor(SERVICE_CAPABILITIES),
	// Symposia gates documents too (the shelf browse fragment), so "all flags on" has to
	// include it or this pass stops exercising the widest document set.
	...Object.fromEntries(DEPLOYMENT_FLAGS.map((flag) => [flag, "true"])),
};

/**
 * The flags a deployment on a given RELEASE would have: every capability that release
 * actually serves, and none that landed after it.
 *
 * `meetsServiceVersion(version, null)` is false, so a capability with no release - which
 * is what `since: null` means - is off in every pass. That is the claim under test.
 */
const capabilitiesAt = (version: string) =>
	SERVICE_CAPABILITIES.filter(
		(entry) => meetsServiceVersion(version, entry.since) === true,
	);

/**
 * One pass per release we hold a schema for. A list, not four copied blocks: adding the
 * next release is a row here, and the "not vacuous" assertion below then covers it too.
 */
const RELEASE_PASSES = ["9.0.0", "9.1.0"].map((version) => {
	const capabilities = capabilitiesAt(version);
	return {
		version,
		schema: schemaFrom(`schema.v${version}.graphqls`),
		capabilities,
		flags: flagsFor(capabilities),
	};
});

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

	for (const { version, schema, capabilities, flags } of RELEASE_PASSES) {
		it.each(
			files.filter((file) => {
				const gate = FLAG_ONLY[shortName(file)];
				return !gate || gate in flags;
			}),
		)(`%s is valid against dcb-service ${version} (the release's flags)`, async (
			file,
		) => {
			vi.stubGlobal("window", { __APP_ENV__: flags });

			const documents = documentsFrom(
				(await modules[file]()) as Record<string, unknown>,
			);
			expect(documents.length).toBeGreaterThan(0);
			documents.forEach((document) =>
				assertValid(
					document,
					schema,
					`${file} against schema.v${version}.graphqls`,
				),
			);
		});

		it(`the ${version} pass is not vacuous`, () => {
			// It would be if every capability were `since: null`, or if
			// meetsServiceVersion started returning null for a release we hold a schema
			// for. The upper bound is what stops a release pass silently becoming a
			// second copy of the all-flags-on pass.
			expect(capabilities.length).toBeGreaterThan(0);
			expect(capabilities.length).toBeLessThan(SERVICE_CAPABILITIES.length);
		});
	}

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
