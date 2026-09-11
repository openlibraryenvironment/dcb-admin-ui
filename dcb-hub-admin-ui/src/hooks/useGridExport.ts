import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
	GridApiPremium,
	GridColDef,
	GridFilterModel,
	GridSortModel,
} from "@mui/x-data-grid-premium";
import { getFileNameForExport } from "@helpers/dataGrid/getFileNameForExport";
import {
	serialiseExportHeader,
	serialiseExportRows,
} from "@helpers/dataGrid/serialiseExportRows";
import {
	fetchExportPages,
	isAbortError,
} from "@helpers/dataGrid/fetchExportPages";
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
	parts: BlobPart[],
	fileName: string,
	format: ExportFormat,
) => {
	// Blob over a single joined string: the parts are one page of text each, so
	// the browser assembles the file without the tab first holding a second,
	// contiguous copy of it.
	const blob = new Blob(parts, {
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
 * Server-fetched modes page via fetchExportPages, serialising and releasing each
 * page as it arrives. See docs/large-exports.md.
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
	const { t } = useTranslation();
	const router = useRouter();
	const { cfg } = router.options.context as { cfg: any };
	const dcbApiBase = cfg?.VITE_DCB_API_BASE ?? "";
	const endpoint = `${dcbApiBase}/graphql`;

	const abortRef = useRef<AbortController | null>(null);
	const renewedTokenRef = useRef<string | null>(null);

	const [exportProgress, setExportProgress] = useState({
		isExporting: false,
		progress: 0,
		totalRecords: 0,
	});

	// Abandoning the grid abandons its export; nothing else stops the loop.
	useEffect(() => () => abortRef.current?.abort(), []);

	const cancelExport = useCallback(() => abortRef.current?.abort(), []);

	/** Read at call time, never destructured at render - see authHeaders. */
	const currentAuth = () => (router.options.context as { auth: any }).auth;

	const authHeaders = (): Record<string, string> => {
		const contextToken = currentAuth()?.user?.access_token;
		// Prefer the token from an explicit mid-export renewal until React has
		// pushed it into the router context: signinSilent() resolving only
		// dispatches the new user, and the context this reads is replaced a render
		// later. Clears itself once the context has caught up.
		if (contextToken && contextToken === renewedTokenRef.current) {
			renewedTokenRef.current = null;
		}
		const token = renewedTokenRef.current ?? contextToken;
		return token ? { Authorization: `Bearer ${token}` } : {};
	};

	const renewSession = async () => {
		// A failed renewal is not handled here: the retry then sends the same dead
		// token, the 401 stands, and the export reports it. application.tsx owns
		// deciding whether the session is actually over.
		const user = await currentAuth()
			?.signinSilent()
			.catch(() => null);
		renewedTokenRef.current = user?.access_token ?? null;
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
		const colLookup = new Map(columns.map((c) => [c.field, c]));
		const valueLabelMaps = getValueLabelMaps(columns);

		// Resolve each cell exactly as the grid does, so a server-fetched export
		// matches the on-screen values for nested/derived columns.
		const flattenRow = (rawRow: any): Record<string, any> => {
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
		};

		// One text chunk per page. The rows behind each chunk are unreachable as
		// soon as it is pushed, so peak memory is the file plus a page - not the
		// whole result set, its flattened copy and a contiguous string of both.
		const parts: BlobPart[] = [
			`${serialiseExportHeader(chosenHeaders, delimiter)}\n`,
		];
		const appendPage = (rows: any[]) => {
			if (rows.length === 0) return;
			const lines = serialiseExportRows(
				rows.map(flattenRow),
				delimiter,
				chosenFields,
				valueLabelMaps,
			);
			parts.push(`${lines.join("\n")}\n`);
		};

		const controller = new AbortController();
		abortRef.current = controller;

		try {
			let rowCount: number;

			if (mode === "selected") {
				const rows = Array.from(apiRef.current.getSelectedRows().values());
				appendPage(rows);
				rowCount = rows.length;
			} else {
				setExportProgress({
					isExporting: true,
					progress: 0,
					totalRecords: 0,
				});

				rowCount = await fetchExportPages({
					endpoint,
					query: config.query,
					coreType: config.coreType,
					variables: buildServerGridQueryVars({
						filterModel: mode === "filtered" ? filterModel : EMPTY_FILTER,
						sortModel,
						paginationModel: { page: 0, pageSize: EXPORT_PAGE_SIZE },
						baseQuery: config.baseQuery ?? "",
						quickFilterFields: config.quickFilterFields ?? [],
						defaultOrder: sortModel[0]?.field ?? "id",
						defaultPageSize: EXPORT_PAGE_SIZE,
					}),
					authHeaders,
					renewSession,
					onPage: appendPage,
					onProgress: (fetched, totalSize) =>
						setExportProgress({
							isExporting: true,
							totalRecords: totalSize,
							progress: totalSize
								? Math.round((fetched / totalSize) * 100)
								: 100,
						}),
					signal: controller.signal,
				});
			}

			triggerDownload(parts, `${baseFileName}.${format}`, format);
			onSuccess(
				t("ui.data_grid.export_success", { count: rowCount }),
				rowCount,
			);
		} catch (error) {
			// A cancelled export is the outcome the user asked for, not a failure.
			if (isAbortError(error)) return;
			console.error("Grid export failed", error);
			onError(t("ui.data_grid.export_failed"));
		} finally {
			abortRef.current = null;
			renewedTokenRef.current = null;
			setExportProgress({ isExporting: false, progress: 0, totalRecords: 0 });
		}
	};

	return { exportProgress, runExport, cancelExport };
};
