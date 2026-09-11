// Helper function to format cell value
const formatCellValue = (value: any, delimiter: string): string => {
	if (value === null || value === undefined) {
		return "";
	}
	const stringValue = value.toString();
	if (
		stringValue.includes(delimiter) ||
		stringValue.includes('"') ||
		stringValue.includes("\n")
	) {
		return `"${stringValue.replace(/"/g, '""')}"`;
	}
	return stringValue;
};

/** The header line, from the same `headers` array the rows are aligned to. */
export const serialiseExportHeader = (
	headers: string[],
	delimiter: string,
): string => headers.join(delimiter);

/**
 * Serialises export rows to one delimited string per row, so a caller can
 * serialise a page at a time (docs/large-exports.md). `fields` aligns with the
 * `headers` passed to serialiseExportHeader; both come from getExportColumns.
 *
 * Rows arriving here are already flat - useGridExport resolves each cell through
 * the column's own valueGetter/valueFormatter. Do not reintroduce a source-path
 * registry here: it drifts from the columns and silently blanks cells.
 */
export const serialiseExportRows = (
	data: any[],
	delimiter: string,
	fields: string[],
	// field -> (value -> label) for singleSelect columns; maps codes/UUIDs to the
	// same human labels the grid shows (see getValueLabelMaps).
	valueLabelMaps: Record<string, Record<string, string>> = {},
): string[] =>
	data.map((item: any) =>
		fields
			.map((field: string) => {
				const rawValue = item[field];
				const labelMap = valueLabelMaps[field];
				const value =
					labelMap && rawValue != null
						? (labelMap[String(rawValue)] ?? rawValue)
						: rawValue;
				return formatCellValue(value, delimiter);
			})
			.join(delimiter),
	);
