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

/**
 * Serialises server-fetched export rows to a delimited string. `fields` and
 * `headers` are aligned arrays derived from the grid's own columns (see
 * getExportColumns), so the column picker, the grid, and the file all agree.
 *
 * Rows arriving here are already flat: useGridExport resolves each cell through
 * the column's own valueGetter/valueFormatter, so nested and derived fields are
 * the columns' business, not this function's. Do not reintroduce a source-path
 * registry here - it drifts from the columns and silently blanks cells.
 */
export const convertFileToString = (
	data: any[],
	delimiter: string,
	fields: string[],
	headers: string[],
	// field -> (value -> label) for singleSelect columns; maps codes/UUIDs to the
	// same human labels the grid shows (see getValueLabelMaps).
	valueLabelMaps: Record<string, Record<string, string>> = {},
) => {
	const headerRow = headers.join(delimiter);

	const rows = data.map((item: any) =>
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

	return [headerRow, ...rows].join("\n");
};
