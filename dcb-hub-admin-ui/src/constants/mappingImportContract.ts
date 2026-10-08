/**
 * The columns dcb-service's mapping importer accepts, in the order it reads them.
 *
 * The header row is validated by name AND by position, and cells are then read by
 * index, so this order and these names are the whole contract. Why that is, and what
 * breaks without it: docs/mappings-export.md.
 *
 * `field` is this app's grid/GraphQL field; `header` is what the importer calls it.
 * They differ for numeric range mappings.
 */
export interface MappingImportColumn {
	field: string;
	header: string;
}

export const REFERENCE_VALUE_MAPPING_IMPORT_COLUMNS: readonly MappingImportColumn[] =
	[
		{ field: "fromContext", header: "fromContext" },
		{ field: "fromCategory", header: "fromCategory" },
		{ field: "fromValue", header: "fromValue" },
		{ field: "toContext", header: "toContext" },
		{ field: "toCategory", header: "toCategory" },
		{ field: "toValue", header: "toValue" },
	];

export const NUMERIC_RANGE_MAPPING_IMPORT_COLUMNS: readonly MappingImportColumn[] =
	[
		{ field: "context", header: "context" },
		{ field: "domain", header: "domain" },
		{ field: "lowerBound", header: "lowerBound" },
		{ field: "upperBound", header: "upperBound" },
		{ field: "mappedValue", header: "toValue" },
		{ field: "targetContext", header: "toContext" },
	];

/**
 * `DCBConfigurationService.getExpectedHeaders`, copied verbatim. The contracts
 * above are checked against this in mappingImportContract.test.ts, so a change on
 * the server side fails a test here rather than a librarian's upload.
 */
export const DCB_SERVICE_EXPECTED_HEADERS = {
	referenceValueMappings: [
		"fromContext",
		"fromCategory",
		"fromValue",
		"toContext",
		"toCategory",
		"toValue",
	],
	numericRangeMappings: [
		"context",
		"domain",
		"lowerBound",
		"upperBound",
		"toValue",
		"toContext",
	],
} as const;

/**
 * The contract for a grid, by the GraphQL collection it lists - which is also the
 * `coreType` its export config already carries, so a mappings grid names its
 * round-trip shape once and cannot name a mismatched one.
 */
export const MAPPING_IMPORT_COLUMNS = {
	referenceValueMappings: REFERENCE_VALUE_MAPPING_IMPORT_COLUMNS,
	numericRangeMappings: NUMERIC_RANGE_MAPPING_IMPORT_COLUMNS,
} as const;
