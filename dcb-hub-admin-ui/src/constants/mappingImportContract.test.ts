import { describe, expect, it } from "vitest";

import {
	DCB_SERVICE_EXPECTED_HEADERS,
	NUMERIC_RANGE_MAPPING_IMPORT_COLUMNS,
	REFERENCE_VALUE_MAPPING_IMPORT_COLUMNS,
} from "./mappingImportContract";
import { standardRefValueMappingColumns } from "@columns/referenceValueMappingColumns";
import { standardNumRangeMappingColumns } from "@columns/numericRangeMappingColumns";

/**
 * A mappings export exists to be edited and uploaded again. It had stopped
 * round-tripping in four ways at once - the header row carried display names, the
 * first two columns were swapped, `toValue` and `toCategory` were swapped, and a
 * non-importable "Last imported" column sat at index 5 where `toValue` must be -
 * so every re-upload was refused at column 1 until the librarian rewrote the file
 * by hand. These tests are the contract that stops it drifting again.
 */
describe("the mapping import contract matches dcb-service", () => {
	it("writes reference value mapping headers in the importer's order", () => {
		expect(REFERENCE_VALUE_MAPPING_IMPORT_COLUMNS.map((c) => c.header)).toEqual(
			DCB_SERVICE_EXPECTED_HEADERS.referenceValueMappings,
		);
	});

	it("writes numeric range mapping headers in the importer's order", () => {
		expect(NUMERIC_RANGE_MAPPING_IMPORT_COLUMNS.map((c) => c.header)).toEqual(
			DCB_SERVICE_EXPECTED_HEADERS.numericRangeMappings,
		);
	});

	it("never exports a column the importer refuses to read", () => {
		// The importer reads exactly six columns and rejects a file with fewer. A
		// seventh - `lastImported` was one - shifts nothing but is dead weight in a
		// file whose only purpose is to go back in.
		expect(REFERENCE_VALUE_MAPPING_IMPORT_COLUMNS).toHaveLength(6);
		expect(NUMERIC_RANGE_MAPPING_IMPORT_COLUMNS).toHaveLength(6);
	});
});

describe("every contract field is a real grid column", () => {
	// The export resolves each cell through the grid column's own
	// valueGetter/valueFormatter, so a `field` with no column behind it silently
	// exports a blank - and a blank in the first six columns is refused on upload.
	it("resolves every reference value mapping field", () => {
		const fields = new Set(standardRefValueMappingColumns.map((c) => c.field));
		for (const column of REFERENCE_VALUE_MAPPING_IMPORT_COLUMNS) {
			expect(fields, `no grid column for "${column.field}"`).toContain(
				column.field,
			);
		}
	});

	it("resolves every numeric range mapping field", () => {
		const fields = new Set(standardNumRangeMappingColumns.map((c) => c.field));
		for (const column of NUMERIC_RANGE_MAPPING_IMPORT_COLUMNS) {
			expect(fields, `no grid column for "${column.field}"`).toContain(
				column.field,
			);
		}
	});
});
