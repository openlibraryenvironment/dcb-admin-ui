import { describe, expect, it } from "vitest";

import {
	MAPPING_IMPORT_COLUMNS,
	DCB_SERVICE_EXPECTED_HEADERS,
} from "@constants/mappingImportContract";
import {
	serialiseExportHeader,
	serialiseExportRows,
} from "./serialiseExportRows";

/**
 * The whole round trip, as a file: serialise a mapping the way the export does,
 * then check it against what dcb-service's parser requires of it.
 *
 * `DCBConfigurationService.parseFile` compares each header with `equalsIgnoreCase`
 * and throws on the first mismatch, then reads cells by index and refuses any of
 * the first six that is blank. This reproduces all three checks, so the defect
 * libraries reported - "to reimport we have to change the orders and names of the
 * columns" - fails here before it reaches anybody's upload.
 */
const TAB = "\t";

const headerOf = (key: keyof typeof MAPPING_IMPORT_COLUMNS) =>
	serialiseExportHeader(
		MAPPING_IMPORT_COLUMNS[key].map((column) => column.header),
		TAB,
	).split(TAB);

const rowOf = (
	key: keyof typeof MAPPING_IMPORT_COLUMNS,
	row: Record<string, unknown>,
) =>
	serialiseExportRows(
		[row],
		TAB,
		MAPPING_IMPORT_COLUMNS[key].map((column) => column.field),
	)[0].split(TAB);

describe("a reference value mapping export re-imports", () => {
	// One row as the GraphQL query returns it, including the lastImported the grid
	// shows and the importer must never be handed.
	const mapping = {
		id: "d4f1",
		fromCategory: "ItemType",
		fromContext: "DCB",
		fromValue: "loanable-item",
		toCategory: "ItemType",
		toContext: "MVU",
		toValue: "1",
		lastImported: "2026-09-30T10:14:00Z",
		deleted: false,
	};

	it("writes the header dcb-service validates, position for position", () => {
		expect(headerOf("referenceValueMappings")).toEqual(
			DCB_SERVICE_EXPECTED_HEADERS.referenceValueMappings,
		);
	});

	it("puts each value under the header that names it", () => {
		const headers = headerOf("referenceValueMappings");
		const cells = rowOf("referenceValueMappings", mapping);

		expect(Object.fromEntries(headers.map((h, i) => [h, cells[i]]))).toEqual({
			fromContext: "DCB",
			fromCategory: "ItemType",
			fromValue: "loanable-item",
			toContext: "MVU",
			toCategory: "ItemType",
			toValue: "1",
		});
	});

	it("leaves no mandatory cell blank, which the importer refuses", () => {
		const cells = rowOf("referenceValueMappings", mapping);
		expect(cells).toHaveLength(6);
		for (const [index, cell] of cells.entries()) {
			expect(cell, `column ${index + 1} is blank`).not.toBe("");
		}
	});

	it("carries no column the importer does not read", () => {
		const cells = rowOf("referenceValueMappings", mapping);
		expect(cells.join(TAB)).not.toContain("2026-09-30");
	});
});

describe("a numeric range mapping export re-imports", () => {
	// The one place the grid's field names and the importer's differ.
	const mapping = {
		id: "9ab2",
		context: "MVU",
		domain: "patronType",
		lowerBound: "0",
		upperBound: "24",
		mappedValue: "standard",
		targetContext: "DCB",
		lastImported: "2026-09-30T10:14:00Z",
	};

	it("writes the header dcb-service validates, position for position", () => {
		expect(headerOf("numericRangeMappings")).toEqual(
			DCB_SERVICE_EXPECTED_HEADERS.numericRangeMappings,
		);
	});

	it("maps mappedValue to toValue and targetContext to toContext", () => {
		const headers = headerOf("numericRangeMappings");
		const cells = rowOf("numericRangeMappings", mapping);

		expect(Object.fromEntries(headers.map((h, i) => [h, cells[i]]))).toEqual({
			context: "MVU",
			domain: "patronType",
			lowerBound: "0",
			upperBound: "24",
			toValue: "standard",
			toContext: "DCB",
		});
	});
});
