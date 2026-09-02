import { describe, expect, it, afterEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { buildSchema, parse, validate } from "graphql";

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
 * `schema.graphqls` is what the application targets: dcb-service
 * feat/library-account-provisioning, plus the unreleased `auditIncidence`. It is NOT
 * main and NOT a release - see that file's own header for why, and for what has to
 * merge first. `schema.v8.71.0.graphqls` is the release before 9.0.0,
 * taken verbatim from that tag, which the next DCB Admin release also has to run
 * against while v9 works its way to production.
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
	"queries/getAuditIncidence.ts": "VITE_FEATURE_AUDIT_EXPLORER",
	"queries/getLibraryUsers.ts": "VITE_FEATURE_LIBRARY_USER_PROVISIONING",
	"mutations/provisionLibraryUser.ts": "VITE_FEATURE_LIBRARY_USER_PROVISIONING",
};

/**
 * The flags that are on in a 9.0.0-and-later deployment, as inject_env.json would
 * render them. Every declared flag is set, so the "current" pass exercises the widest
 * document set the application can produce.
 */
const ALL_FLAGS_ON = {
	VITE_FEATURE_INSIGHTS: "true",
	VITE_FEATURE_AUDIT_EXPLORER: "true",
	VITE_FEATURE_CONSORTIUM_BRANDING: "true",
	VITE_FEATURE_NCIP_ONBOARDING: "true",
	VITE_FEATURE_LIBRARY_USER_PROVISIONING: "true",
};

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
