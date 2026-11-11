import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
	buildSchema,
	getNamedType,
	isEnumType,
	isScalarType,
	type GraphQLObjectType,
} from "graphql";

import type { TFunction } from "i18next";
import { getPatronRequestColumns } from "./getPatronRequestColumns";

const t = ((key: string) => key) as unknown as TFunction;
const standardPatronRequestColumns = getPatronRequestColumns("standard", t);
const patronRequestColumnsNoStatusFilter = getPatronRequestColumns(
	"noStatus",
	t,
);

// patronRequests passes the sort field straight to Pageable.order (DataFetchers, 8.71.0-9.3.0):
// a field PatronRequest does not have fails the query, and the remembered view repeats it
const fields = (
	buildSchema(
		readFileSync(
			path.resolve(__dirname, "../../schema.v8.71.0.graphqls"),
			"utf8",
		),
	).getType("PatronRequest") as GraphQLObjectType
).getFields();

const unorderable = (field: string) => {
	const definition = fields[field];
	if (!definition) return true;
	const type = getNamedType(definition.type);
	return !isScalarType(type) && !isEnumType(type);
};

describe.each([
	["standard", standardPatronRequestColumns],
	["no status", patronRequestColumnsNoStatusFilter],
])("%s patron request columns", (_, columns) => {
	it("offer sorting only on fields dcb-service can order by", () => {
		expect(
			columns
				.filter((column) => column.sortable !== false)
				.map((column) => column.field)
				.filter(unorderable),
		).toEqual([]);
	});
});

// It showed the supplier's item type while filtering and sorting on the request's own
it("shows the request's own local item type, which is what it filters and sorts on", () => {
	const column = standardPatronRequestColumns.find(
		(each) => each.field === "localItemType",
	);
	expect(column?.valueGetter).toBeUndefined();
});

// The 36 headers were English literals, so no other language could reach them
it("takes every header from the translation catalogue", () => {
	const marked = ((key: string) => `«${key}»`) as unknown as TFunction;
	expect(
		getPatronRequestColumns("standard", marked)
			.map((column) => column.headerName ?? "«»")
			.filter((header) => !header.startsWith("«")),
	).toEqual([]);
});
