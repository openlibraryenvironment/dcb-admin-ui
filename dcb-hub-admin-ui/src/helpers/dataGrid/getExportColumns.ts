import { GridColDef } from "@mui/x-data-grid-premium";

// Grid-internal columns that must never appear in an export.
const NON_EXPORT_FIELDS = new Set([
	"actions",
	"__check__",
	"__detail_panel_toggle__",
	"__reorder__",
]);

export interface ExportColumn {
	field: string;
	headerName: string;
}

/**
 * Derives the exportable columns from a grid's own `GridColDef[]`, so the export
 * (and the export wizard's column picker) always match what the grid actually
 * shows - replacing the previously hardcoded, drift-prone per-type field lists.
 *
 * Every export-only field is expected to be defined as a (hidden) grid column,
 * so there is a single source of truth for columns and their headers.
 */
export const getExportColumns = (columns: GridColDef[]): ExportColumn[] =>
	columns
		.filter(
			(col) => col.type !== "actions" && !NON_EXPORT_FIELDS.has(col.field),
		)
		.map((col) => ({
			field: col.field,
			headerName:
				typeof col.headerName === "string" && col.headerName.length > 0
					? col.headerName
					: col.field,
		}));

/** Field -> header lookup for the given grid columns. */
export const getExportHeaderMap = (
	columns: GridColDef[],
): Record<string, string> =>
	Object.fromEntries(
		getExportColumns(columns).map(({ field, headerName }) => [
			field,
			headerName,
		]),
	);

/**
 * For `singleSelect` columns whose `valueOptions` are `{ value, label }` pairs
 * (e.g. patron/supplying library, pickup location), builds a field -> (value ->
 * label) lookup. The grid and MUI's native export resolve these labels
 * automatically; server-fetched exports need this so they show the same human
 * names instead of the underlying host-LMS code / UUID.
 */
export const getValueLabelMaps = (
	columns: GridColDef[],
): Record<string, Record<string, string>> => {
	const maps: Record<string, Record<string, string>> = {};
	for (const col of columns) {
		if (!("valueOptions" in col)) continue;
		const options = col.valueOptions;
		if (!Array.isArray(options)) continue;
		const map: Record<string, string> = {};
		for (const option of options) {
			if (
				option &&
				typeof option === "object" &&
				"value" in option &&
				"label" in option &&
				option.value != null
			) {
				map[String(option.value)] = String(option.label);
			}
		}
		if (Object.keys(map).length > 0) {
			maps[col.field] = map;
		}
	}
	return maps;
};
