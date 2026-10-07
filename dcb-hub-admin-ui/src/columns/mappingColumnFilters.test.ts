import { describe, expect, it } from "vitest";
import type { GridColDef } from "@mui/x-data-grid-premium";

import { standardRefValueMappingColumns } from "./referenceValueMappingColumns";
import { referenceValueMappingColumnsNoCategoryFilter } from "./referenceValueMappingsNoCategoryFilter";
import { standardNumRangeMappingColumns } from "./numericRangeMappingColumns";
import { numericRangeMappingColumnsNoCategoryFilter } from "./numericRangeMappingColumnsNoCategoryFilter";

/**
 * A consortium-wide mappings grid has to be narrowable to one library, or there is
 * no way to export one library's mappings from it - which is what a live consortium
 * reported. The context columns carried `filterable: false`.
 * Why it is safe to filter on them: docs/mappings-export.md.
 */
const filterableFields = (columns: GridColDef[]) =>
	columns.filter((column) => column.filterable !== false).map((c) => c.field);

describe("a mappings grid can be narrowed by context", () => {
	it.each([
		["consortium-wide reference value", standardRefValueMappingColumns],
		[
			"per-library reference value",
			referenceValueMappingColumnsNoCategoryFilter,
		],
	])("%s mappings filter on both contexts", (_name, columns) => {
		expect(filterableFields(columns)).toEqual(
			expect.arrayContaining(["fromContext", "toContext"]),
		);
	});

	it.each([
		["consortium-wide numeric range", standardNumRangeMappingColumns],
		["per-library numeric range", numericRangeMappingColumnsNoCategoryFilter],
	])("%s mappings filter on context", (_name, columns) => {
		expect(filterableFields(columns)).toContain("context");
	});

	it("gives every filterable context column operators the backend answers", () => {
		// buildFilterQuery only turns a known operator into Lucene. A column left on
		// MUI's stock string operators offers "starts with" and "is empty", which
		// reach the server as nothing at all and silently return the unfiltered set.
		for (const field of ["fromContext", "toContext"]) {
			const column = standardRefValueMappingColumns.find(
				(c) => c.field === field,
			);
			expect(column?.filterOperators, field).toBeDefined();
		}
	});
});
