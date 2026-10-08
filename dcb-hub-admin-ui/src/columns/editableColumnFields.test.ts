import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { buildSchema, isInputObjectType, type GraphQLSchema } from "graphql";

import { ENTITY_REGISTRY, type EntityKey } from "@constants/entityRegistry";
import { unsupportedInputKeys } from "@helpers/capabilityFields";

/**
 * Every editable grid column names a field its mutation will accept.
 *
 * Checked by nothing before: schemaConformance validates DOCUMENTS, and the offending
 * key is in the VARIABLES, assembled at runtime from whatever the grid changed. `tsc`
 * sees `GridColDef`, whose `field` is a string.
 *
 * Two schemas, because a field has to exist on the target or it is accepted nowhere -
 * and if it is also absent from 8.71.0 it must be a capability-registry field, which is
 * what makes useEntityMutation strip it before an older deployment sees it.
 */

const repoRoot = process.cwd();
const read = (file: string) =>
	readFileSync(path.resolve(repoRoot, file), "utf8");
const schemaFrom = (file: string) => buildSchema(read(file));

const CURRENT = schemaFrom("schema.graphqls");
const LEGACY = schemaFrom("schema.v8.71.0.graphqls");

/**
 * Which files hold each entity's editable columns.
 *
 * Declared rather than discovered, because only a human knows which entity a grid of
 * rows is OF — and `Record<EntityKey, ...>` means a new registry entry does not compile
 * until somebody has answered the question for it. The drift guard at the bottom checks
 * the list back against the files that actually declare an editable column, so an empty
 * array is a reviewable claim and not an omission.
 */
const EDITABLE_COLUMNS: Record<EntityKey, readonly string[]> = {
	library: ["src/columns/libraryColumns.ts"],
	location: [
		"src/columns/locationColumns.ts",
		"src/routes/__authenticated/libraries/$libraryId/locations/index.tsx",
	],
	referenceValueMapping: [
		"src/columns/referenceValueMappingColumns.ts",
		"src/columns/referenceValueMappingsNoCategoryFilter.ts",
	],
	numericRangeMapping: [
		"src/columns/numericRangeMappingColumns.ts",
		"src/columns/numericRangeMappingColumnsNoCategoryFilter.ts",
	],
	consortiumContact: ["src/routes/__authenticated/consortium/contacts.tsx"],
	libraryContact: [
		"src/routes/__authenticated/libraries/$libraryId/contacts.tsx",
	],
	functionalSetting: [
		"src/routes/__authenticated/consortium/functionalSettings.tsx",
	],
	// Edited on a library's settings tab as a form, never in a grid.
	agency: [],
	// Edited on its own page, deliberately: the client config's required keys have to be
	// asked for as a set and re-verified together, which a cell cannot do.
	hostLms: [],
};

/**
 * Columns whose edit writes row fields other than the column's own `field`.
 *
 * The contacts grids show one "Name" column and a `valueSetter` splits it across
 * `firstName` and `lastName`, so `name` never reaches `UpdatePersonInput` — which is
 * correct, and indistinguishable from the `toCategory` defect without saying so here.
 */
const COLUMN_FIELD_WRITES: Partial<
	Record<EntityKey, Record<string, readonly string[]>>
> = {
	consortiumContact: { name: ["firstName", "lastName"] },
	libraryContact: { name: ["firstName", "lastName"] },
};

/** `$input: UpdateLocationInput!` -> `UpdateLocationInput`. */
const inputTypeOf = (document: string): string => {
	const match = /\$input:\s*([A-Za-z0-9_]+)!/.exec(document);
	if (!match) throw new Error(`No $input variable in:\n${document}`);
	return match[1];
};

const inputFieldsOf = (
	schema: GraphQLSchema,
	typeName: string,
): Set<string> | null => {
	const type = schema.getType(typeName);
	if (!type || !isInputObjectType(type)) return null;
	return new Set(Object.keys(type.getFields()));
};

/**
 * The `field` of every column in a source file that is `editable: true`.
 *
 * Splitting on `field: "` makes each chunk run exactly to the next column, so an
 * `editable: true` inside one belongs to it. Textual on purpose: these column arrays
 * are built inside components, with `t()` calls and render props in them, so importing
 * them would mean standing up React and i18next to read two string literals.
 */
const editableFieldsIn = (source: string): string[] =>
	source
		.split(/field:\s*"/)
		.slice(1)
		.flatMap((chunk) => {
			const end = chunk.indexOf('"');
			return /editable:\s*true/.test(chunk.slice(end))
				? [chunk.slice(0, end)]
				: [];
		});

/** Flags are off in tests (vitest.setup.ts), so this is every gated input key. */
const GATED_KEYS = unsupportedInputKeys();

const entities = (Object.keys(ENTITY_REGISTRY) as EntityKey[]).filter(
	(entity) => ENTITY_REGISTRY[entity].updateMutation,
);

const documentOf = (entity: EntityKey): string => {
	const document = ENTITY_REGISTRY[entity].updateMutation;
	return typeof document === "function" ? document() : (document ?? "");
};

describe("editable columns name fields their mutation accepts", () => {
	it("finds the columns", () => {
		const total = entities.flatMap((entity) =>
			EDITABLE_COLUMNS[entity].flatMap((file) => editableFieldsIn(read(file))),
		);
		expect(total.length).toBeGreaterThan(10);
	});

	it.each(
		entities.flatMap((entity) =>
			EDITABLE_COLUMNS[entity].map((file) => ({ entity, file })),
		),
	)("$file edits only what $entity's mutation takes", ({ entity, file }) => {
		const typeName = inputTypeOf(documentOf(entity));
		const current = inputFieldsOf(CURRENT, typeName);
		const legacy = inputFieldsOf(LEGACY, typeName);
		expect(
			current,
			`${typeName} is not an input type on the target schema`,
		).not.toBeNull();

		const writes = COLUMN_FIELD_WRITES[entity] ?? {};

		for (const column of editableFieldsIn(read(file))) {
			for (const field of writes[column] ?? [column]) {
				expect(
					current!.has(field),
					`${file} offers "${column}" for editing, which sends "${field}" — ` +
						`${typeName} does not declare it, so the whole row edit fails with ` +
						`a GraphQL validation error.`,
				).toBe(true);

				// Absent from 8.71.0 is allowed only for a capability the registry
				// strips. Anything else breaks every deployment on the release.
				if (legacy && !legacy.has(field)) {
					expect(
						GATED_KEYS.has(field),
						`${file} offers "${column}" ("${field}"), which ${typeName} gained ` +
							`after 8.71.0 and no capability row gates. It would be sent ` +
							`verbatim to a deployment that cannot accept it.`,
					).toBe(true);
				}
			}
		}
	});

	/**
	 * Guard the guard: every file in the app that declares an editable column is
	 * accounted for above.
	 *
	 * Without this the check is only as good as somebody's memory of the list, which is
	 * the failure mode `schemaConformance.test.ts` records for its own hand-maintained
	 * flag list — the widest pass had quietly stopped covering two capabilities.
	 */
	it("accounts for every file that declares an editable column", () => {
		const sourcesUnder = (dir: string): string[] =>
			readdirSync(path.resolve(repoRoot, dir), {
				withFileTypes: true,
			}).flatMap((entry) => {
				const next = path.join(dir, entry.name);
				if (entry.isDirectory()) return sourcesUnder(next);
				return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)
					? [next]
					: [];
			});

		const declared = new Set(
			Object.values(EDITABLE_COLUMNS)
				.flat()
				.map((file) => path.normalize(file)),
		);

		const found = [
			...sourcesUnder("src/columns"),
			...sourcesUnder("src/routes"),
			...sourcesUnder("src/components"),
		].filter((file) => editableFieldsIn(read(file)).length > 0);

		// `OperatingWelcome` edits nothing persisted through ENTITY_REGISTRY: its grid
		// is the setup wizard's own local checklist, and its processRowUpdate writes to
		// component state. Exempt by name so the exemption is reviewed, not inferred.
		const exempt = new Set(
			["src/components/OperatingWelcome/OperatingWelcome.tsx"].map((file) =>
				path.normalize(file),
			),
		);

		expect(
			found.filter((file) => !declared.has(file) && !exempt.has(file)),
		).toEqual([]);
	});
});
