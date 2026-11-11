import type { RefObject } from "react";
import {
	gridFilteredSortedRowIdsSelector,
	gridPaginatedVisibleSortedGridRowIdsSelector,
	gridSortedRowIdsSelector,
	type GridApiPremium,
	type GridGetRowsToExportParams,
	type GridRowId,
} from "@mui/x-data-grid-premium";

import { downloadBlob } from "@helpers/downloadBlob";

type Rows = (params: GridGetRowsToExportParams) => GridRowId[];

const ROWS: Record<string, Rows> = {
	current: ({ apiRef }) => gridPaginatedVisibleSortedGridRowIdsSelector(apiRef),
	filtered: ({ apiRef }) => gridFilteredSortedRowIdsSelector(apiRef),
	all: ({ apiRef }) => gridSortedRowIdsSelector(apiRef),
};

/**
 * The toolbar's export, for a grid that holds every row in the browser: MUI's own exporter
 * over the rows already there, with no request. "filtered" is what the reader sees, "all"
 * ignores their filters, "current" is the page on screen.
 */
export async function exportClientGrid(
	apiRef: RefObject<GridApiPremium | null>,
	format: string,
	mode: string,
	fileName: string,
): Promise<void> {
	const api = apiRef.current;
	if (!api) return;
	const getRowsToExport = ROWS[mode] ?? ROWS.filtered;

	// Print's default is the rows the reader has filtered to
	if (mode === "print") return api.exportDataAsPrint();
	if (format === "excel")
		return api.exportDataAsExcel({ fileName, getRowsToExport });

	const tsv = format === "tsv";
	const text = api.getDataAsCsv({
		delimiter: tsv ? "\t" : ",",
		getRowsToExport,
	});
	downloadBlob(
		`${fileName}.${tsv ? "tsv" : "csv"}`,
		new Blob([text], {
			type: tsv ? "text/tab-separated-values" : "text/csv",
		}),
	);
}
