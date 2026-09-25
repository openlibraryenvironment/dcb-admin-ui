import { describe, expect, it, afterEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { buildSchema, isInputObjectType } from "graphql";

import {
	DEPLOYMENT_FLAGS,
	SERVICE_CAPABILITIES,
	meetsServiceVersion,
} from "@constants/serviceCapabilities";
import { unsupportedInputKeys } from "@helpers/capabilityFields";

/**
 * Every key this application can SEND must be declared by the dcb-service it is sent to —
 * R-19, the half schemaConformance.test.ts cannot see: a mutation's document is valid
 * whatever its variables hold, because `updateLibrary(input: $input)` names no field. An
 * undeclared key in the input object is rejected at coercion instead - "Field X is not
 * defined by type UpdateLibraryInput" - failing the whole mutation exactly as an
 * undeclared selection does.
 *
 * Not covered: whether a call site reaches `stripUnsupportedKeys` at all.
 */

const repoRoot = process.cwd();

const schemaFrom = (file: string) =>
	buildSchema(readFileSync(path.resolve(repoRoot, file), "utf8"));

/** The fields a release declares on one input type, or null when it has no such type. */
const declaredFields = (
	schema: ReturnType<typeof buildSchema>,
	typeName: string,
): ReadonlySet<string> | null => {
	const type = schema.getType(typeName);
	return isInputObjectType(type) ? new Set(Object.keys(type.getFields())) : null;
};

/** Every input-type field the registry gates, as [type, field] pairs. */
const GATED_INPUT_FIELDS: ReadonlyArray<readonly [string, string]> =
	SERVICE_CAPABILITIES.flatMap((entry) =>
		Object.entries(entry.fields)
			.filter(([type]) => type.endsWith("Input"))
			.flatMap(([type, fields]) =>
				fields.map((field) => [type, field] as const),
			),
	);

const flagsFor = (capabilities: readonly { flag: string }[]) =>
	Object.fromEntries(capabilities.map((entry) => [entry.flag, "true"]));

/**
 * On in every pass below, including the 8.71.0 one.
 *
 * VITE_FEATURE_SYMPOSIA says the consortium runs the discovery product, which is
 * independent of which dcb-service it runs - and `isShelfBrowseEnabled` is the AND of it
 * and VITE_FEATURE_SHELF_BROWSE, so a pass without it reports that field stripped whatever
 * its own flag says, and asserts nothing about it.
 */
const DEPLOYMENT = Object.fromEntries(
	DEPLOYMENT_FLAGS.map((flag) => [flag, "true"]),
);

/**
 * One pass per release we hold a schema for, each with the flags a Symposia-running
 * deployment on that release would have.
 *
 * The release passes are the ones that catch a wrong THRESHOLD: 9.0.0 declares the brand
 * columns and neither `maxLocalHolds` nor `supportUrl`, so a row claiming 9.0.0 for a
 * field that arrived in 9.1.0 passes an all-off pass and fails here.
 */
const PASSES = ["8.71.0", "9.0.0", "9.1.0"].map((version) => {
	const capabilities = SERVICE_CAPABILITIES.filter(
		(entry) => meetsServiceVersion(version, entry.since) === true,
	);
	return {
		version,
		schema: schemaFrom(`schema.v${version}.graphqls`),
		flags: { ...DEPLOYMENT, ...flagsFor(capabilities) },
	};
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("mutation variables are accepted by the dcb-service they target", () => {
	it("the registry gates input fields at all", () => {
		// Guard the guard. Renaming the `fields` key or dropping the Input convention
		// would leave every assertion below iterating an empty list and passing.
		expect(GATED_INPUT_FIELDS.length).toBeGreaterThan(0);
	});

	for (const { version, schema, flags } of PASSES) {
		it(`sends no undeclared key to dcb-service ${version}`, () => {
			vi.stubGlobal("window", { __APP_ENV__: flags });

			const stripped = unsupportedInputKeys();
			const undeclared = GATED_INPUT_FIELDS.filter(([type, field]) => {
				if (stripped.has(field)) return false;
				const declared = declaredFields(schema, type);
				return declared === null || !declared.has(field);
			});

			expect(
				undeclared.map(([type, field]) => `${type}.${field}`),
				`survives the strip on ${version} but is not declared there`,
			).toEqual([]);
		});
	}

	it("fails without the strip", () => {
		// The assertions above pass vacuously if `unsupportedInputKeys` ever returns
		// everything, or if the oldest schema happens to declare every gated field. Both
		// are real regressions and neither is visible from a green pass, so the probe is
		// run once with the strip removed and has to FAIL.
		vi.stubGlobal("window", undefined);

		const legacy = PASSES[0].schema;
		const undeclared = GATED_INPUT_FIELDS.filter(([type, field]) => {
			const declared = declaredFields(legacy, type);
			return declared === null || !declared.has(field);
		});

		expect(undeclared.length).toBeGreaterThan(0);
		expect(unsupportedInputKeys().size).toBeGreaterThan(0);
	});

	it("strips nothing once every capability is switched on", () => {
		// The mirror of the above: a strip set that is non-empty with all flags ON would
		// silently drop a field the server does declare, which reads to a user as a save
		// that succeeded and changed nothing.
		vi.stubGlobal("window", {
			__APP_ENV__: { ...DEPLOYMENT, ...flagsFor(SERVICE_CAPABILITIES) },
		});

		expect([...unsupportedInputKeys()]).toEqual([]);
	});
});
