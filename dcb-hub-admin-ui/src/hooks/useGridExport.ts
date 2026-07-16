import { RefObject, useState } from "react";
import request from "graphql-request";
import { useRouter } from "@tanstack/react-router";
import {
	GridApiPremium,
	GridColDef,
	GridFilterModel,
	GridSortModel,
} from "@mui/x-data-grid-premium";
import { getFileNameForExport } from "@helpers/dataGrid/getFileNameForExport";
import { convertFileToString } from "@helpers/dataGrid/convertFileToString";
import {
	getExportColumns,
	getExportHeaderMap,
	getValueLabelMaps,
} from "@helpers/dataGrid/getExportColumns";
import {
	buildServerGridQueryVars,
	generateFilterDescription,
} from "@helpers/dataGrid/utilities";

export interface GridExportConfig {
	/** GraphQL document that returns the full (paged) dataset for this grid. */
	query: any;
	/** Response key holding the paged connection, e.g. "patronRequests". */
	coreType: string;
	/**
	 * Scope that must survive an "all" export - the base Lucene clause (e.g. a
	 * single library's mappings). "all" strips the user's column filters but
	 * keeps this so it never leaks other libraries' data.
	 */
	baseQuery?: string;
	/** Fields the toolbar quick-filter searches, folded into "filtered" exports. */
	quickFilterFields?: string[];
	/** Enables the column/scope/format wizard for this grid. */
	wizard?: boolean;
}

export type ExportMode = "current" | "filtered" | "all" | "selected" | "print";
export type ExportFormat = "csv" | "tsv";

export interface RunExportOptions {
	mode: ExportMode;
	format?: ExportFormat;
	/** Explicit column subset (wizard). Defaults to all export columns. */
	fields?: string[];
	/** User-supplied file name (wizard). Falls back to grid id + active filters. */
	fileName?: string;
}

interface UseGridExportProps {
	apiRef: RefObject<GridApiPremium | null>;
	config: GridExportConfig;
	filterModel: GridFilterModel;
	sortModel: GridSortModel;
	columns: GridColDef[];
	/** Grid id - used as the default export file name. */
	identifier: string;
	onSuccess: (message: string, count: number) => void;
	onError: (message: string) => void;
}

const EXPORT_PAGE_SIZE = 1000;
const EMPTY_FILTER: GridFilterModel = { items: [] };

const triggerDownload = (
	dataString: string,
	fileName: string,
	format: ExportFormat,
) => {
	const blob = new Blob([dataString], {
		type: `text/${format};charset=utf-8;`,
	});
	const link = document.createElement("a");
	if (link.download === undefined) return;
	const url = URL.createObjectURL(blob);
	link.setAttribute("href", url);
	link.setAttribute("download", fileName);
	link.style.visibility = "hidden";
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
};

/**
 * Single export engine for every server-driven grid. Modes:
 * - `current`  / `print`: MUI's native export of the on-screen rows.
 * - `selected`: the checkbox-selected rows, built client-side (no fetch).
 * - `filtered`: every page matching the current filter + base query.
 * - `all`:      every page of the base query only (filters stripped, scope kept).
 *
 * Server-fetched modes page through the dataset (1000/page) and report progress
 * so an "all" export of a very large grid stays observable and cancellable by
 * navigating away rather than freezing the tab.
 */
export const useGridExport = ({
	apiRef,
	config,
	filterModel,
	sortModel,
	columns,
	identifier,
	onSuccess,
	onError,
}: UseGridExportProps) => {
	const { cfg, auth } = useRouter().options.context as {
		cfg: any;
		auth: any;
	};
	const dcbApiBase = cfg?.VITE_DCB_API_BASE ?? "";
	const token = auth?.user?.access_token;
	const headers: Record<string, string> = token
		? { Authorization: `Bearer ${token}` }
		: {};

	const [exportProgress, setExportProgress] = useState({
		isExporting: false,
		progress: 0,
		totalRecords: 0,
	});

	const fetchAllPages = async (mode: "filtered" | "all"): Promise<any[]> => {
		setExportProgress({ isExporting: true, progress: 0, totalRecords: 0 });

		const queryVariables = buildServerGridQueryVars({
			filterModel: mode === "filtered" ? filterModel : EMPTY_FILTER,
			sortModel,
			paginationModel: { page: 0, pageSize: EXPORT_PAGE_SIZE },
			baseQuery: config.baseQuery ?? "",
			quickFilterFields: config.quickFilterFields ?? [],
			defaultOrder: sortModel[0]?.field ?? "id",
			defaultPageSize: EXPORT_PAGE_SIZE,
		});

		const endpoint = `${dcbApiBase}/graphql`;
		const initial = await request<any>(
			endpoint,
			config.query,
			queryVariables,
			headers,
		);

		const totalSize = initial?.[config.coreType]?.totalSize || 0;
		let allContent: any[] = initial?.[config.coreType]?.content ?? [];
		setExportProgress({
			isExporting: true,
			totalRecords: totalSize,
			progress: totalSize
				? Math.round((allContent.length / totalSize) * 100)
				: 100,
		});

		const totalPages = Math.ceil(totalSize / EXPORT_PAGE_SIZE);
		for (let page = 1; page < totalPages; page++) {
			const next = await request<any>(
				endpoint,
				config.query,
				{ ...queryVariables, pageno: page },
				headers,
			);
			allContent = [...allContent, ...(next?.[config.coreType]?.content ?? [])];
			setExportProgress((prev) => ({
				...prev,
				progress: Math.round((allContent.length / totalSize) * 100),
			}));
		}

		return allContent;
	};

	const runExport = async ({
		mode,
		format = "tsv",
		fields,
		fileName,
	}: RunExportOptions) => {
		if (!apiRef?.current) return;
		const delimiter = format === "csv" ? "," : "\t";

		// Default file name: grid id plus a slug of any active filters. A wizard
		// name (if given) wins, sanitised of characters illegal in file names.
		const hasActiveFilters = (filterModel.items ?? []).some(
			(item) =>
				item.value !== undefined && item.value !== null && item.value !== "",
		);
		const defaultFileName = getFileNameForExport(
			identifier,
			hasActiveFilters ? generateFilterDescription(filterModel) : null,
		);
		const baseFileName = fileName?.trim()
			? fileName.trim().replace(/[\\/:*?"<>|]+/g, "_")
			: defaultFileName;

		// On-screen rows: let MUI serialise using the grid's own value getters.
		if (mode === "current") {
			apiRef.current.exportDataAsCsv({
				delimiter,
				fileName: baseFileName,
				fields,
				utf8WithBom: true,
			});
			return;
		}
		if (mode === "print") {
			apiRef.current.exportDataAsPrint();
			return;
		}

		const exportColumns = getExportColumns(columns);
		const headerMap = getExportHeaderMap(columns);
		const chosenFields =
			fields && fields.length > 0
				? fields
				: exportColumns.map((col) => col.field);
		const chosenHeaders = chosenFields.map(
			(field) => headerMap[field] ?? field,
		);

		try {
			let rows: any[];
			if (mode === "selected") {
				rows = Array.from(apiRef.current.getSelectedRows().values());
			} else {
				rows = await fetchAllPages(mode);
			}

			const colLookup = new Map(columns.map((c) => [c.field, c]));

			// Resolve each cell exactly as the grid does, so a server-fetched export
			// matches the on-screen values for nested/derived columns.
			const processedRows = rows.map((rawRow) => {
				const flatRow: Record<string, any> = {};

				chosenFields.forEach((field) => {
					const col = colLookup.get(field);
					let cellValue = rawRow[field];
					// Execute the valueGetter if it exists on the column
					if (col?.valueGetter) {
						cellValue = (col.valueGetter as any)(
							cellValue,
							rawRow,
							col,
							apiRef.current,
						);
					}

					if (col?.valueFormatter && cellValue != null) {
						cellValue = (col.valueFormatter as any)(
							cellValue,
							rawRow,
							col,
							apiRef.current,
						);
					}

					flatRow[field] = cellValue;
				});

				return flatRow;
			});

			const dataString = convertFileToString(
				processedRows,
				delimiter,
				chosenFields,
				chosenHeaders,
				getValueLabelMaps(columns),
			);

			triggerDownload(dataString, `${baseFileName}.${format}`, format);
			onSuccess(`Successfully exported ${rows.length} records.`, rows.length);
		} catch (error) {
			console.error("Grid export failed", error);
			onError("Failed to export records.");
		} finally {
			setExportProgress({ isExporting: false, progress: 0, totalRecords: 0 });
		}
	};

	return { exportProgress, runExport };
};
