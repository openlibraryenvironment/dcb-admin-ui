import {
	DataGridPremium,
	DataGridPremiumProps,
	GridApiPremium,
	GridColDef,
	GridColumnVisibilityModel,
	GridEventListener,
	GridExpandLessIcon,
	GridExpandMoreIcon,
	GridRowSelectionModel,
	useGridApiRef,
} from "@mui/x-data-grid-premium";
import { RefObject, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { NoResultsOverlay } from "./components/NoResultsOverlay";
import { useNavigate } from "@tanstack/react-router";
import { SxProps, Theme } from "@mui/material";
import ExportToolbar from "./components/ExportToolbar";
import ExportWizard from "./components/ExportWizard";
import { ExportProgressDialog } from "./components/ExportProgressDialog";
import {
	ExportFormat,
	ExportMode,
	GridExportConfig,
	useGridExport,
} from "@hooks/useGridExport";
import { expandedFilterPanelTypes } from "@constants/dataGrid/types";
import { handleDataGridRowClick } from "@helpers/dataGrid/handleDataGridRowClick";
import TimedAlert from "@components/TimedAlert/TimedAlert";
// Needs reviewing for consortial needs
// check persistent storage
// use grid actions as editing is more of a priority
// custom click path

declare module "@mui/x-data-grid-premium" {
	interface ToolbarPropsOverrides {
		handleExport?: (
			fileType: string,
			exportMode: string,
		) => Promise<void> | void;
		allDataLoading?: boolean;
		type?: string;
		onCleanup?: () => void;
		selectionCount?: number;
		wizardEnabled?: boolean;
		onOpenWizard?: () => void;
	}
}
const IMMUTABLE_FALLBACK_MODES = {};
interface CustomDataGridProps extends Omit<DataGridPremiumProps, "sx"> {
	autoRowHeight?: boolean;
	identifier: string;
	listViewEnabled: boolean;
	noResultsText: string;
	pivotingEnabled: boolean;
	scrollbarVisible: boolean;
	toolbarVisible: boolean;
	searchText: string;
	styleOverrides?: SxProps<Theme>;
	type: string;
	parentApiRef?: RefObject<GridApiPremium | null>;
	enableCleanup?: boolean;
	onCleanup?: () => void;
	onExport?: (fileType: string, exportMode: string) => Promise<void>;
	isExporting?: boolean;
	disableHoverInteractions?: boolean;
	/**
	 * Opts this grid into the shared server-side export (three TSV scopes plus an
	 * optional column/scope/format wizard). Provide the full-dataset export query,
	 * its response key, and any base query / quick-filter fields.
	 */
	exportConfig?: GridExportConfig;
}

export default function DataGrid({
	autoRowHeight,
	enableCleanup,
	identifier,
	isExporting = false,
	listViewEnabled,
	noResultsText,
	onCleanup,
	onExport,
	parentApiRef,
	pivotingEnabled,
	scrollbarVisible,
	searchText,
	styleOverrides,
	toolbarVisible,
	type,
	disableHoverInteractions,
	exportConfig,
	loading,
	paginationMode,
	rowCount,
	rowModesModel = IMMUTABLE_FALLBACK_MODES,
	rows,
	onRowSelectionModelChange,
	...rest
}: CustomDataGridProps) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const expandedFilterPanel = expandedFilterPanelTypes.includes(type);
	const [alert, setAlert] = useState<any>({
		open: false,
		severity: "success",
		text: "",
	}); // We do need to give feedback on editing s
	const internalApiRef = useGridApiRef();
	const apiRef = parentApiRef || internalApiRef;

	const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>({
		type: "include",
		ids: new Set(),
	});

	// Shared server-side export (opt-in via `exportConfig`). The hook lives here
	// because DataGrid already owns the grid API ref, columns, and the current
	// filter/sort - so a grid opts in with a single prop rather than re-wiring
	// the export/progress/wizard plumbing each time.
	const exportColumns = (rest.columns as GridColDef[]) ?? [];
	const [wizardOpen, setWizardOpen] = useState(false);
	const { exportProgress, runExport } = useGridExport({
		apiRef,
		config: exportConfig ?? { query: null, coreType: "" },
		filterModel: rest.filterModel ?? { items: [] },
		sortModel: rest.sortModel ?? [],
		columns: exportColumns,
		identifier,
		onSuccess: (message) =>
			setAlert({ open: true, severity: "success", text: message }),
		onError: (message) =>
			setAlert({ open: true, severity: "error", text: message }),
	});

	const handleExport = exportConfig
		? (fileType: string, exportMode: string) =>
				runExport({
					mode: exportMode as ExportMode,
					format: fileType as ExportFormat,
				})
		: onExport;

	// During its render-phase state initialisation MUI clamps the controlled
	// `paginationModel` page against `rowCount`. Callers pass a transient
	// `rowCount={data?.total ?? 0}` that is `0` while loading, so on first
	// render (with a persisted page > 0) MUI reads a *known* count of zero,
	// clamps the page, and fires `onPaginationModelChange` synchronously during
	// render - which runs the parent's setState and triggers React's "Cannot
	// update a component while rendering a different component" warning.
	// Report the count as unknown (-1) until a real, non-loading count arrives:
	// with an unknown count MUI can't compute a max page, so it never clamps.
	// Once known, we keep the last value across loading refetches so it never
	// drops back to a transient 0. State is adjusted during render (React's
	// supported pattern) rather than in an effect.
	// https://mui.com/x/react-data-grid/pagination/#server-side-pagination
	const [knownRowCount, setKnownRowCount] = useState<number | undefined>(
		loading ? undefined : rowCount,
	);
	if (!loading && rowCount !== undefined && rowCount !== knownRowCount) {
		setKnownRowCount(rowCount);
	}
	const resolvedRowCount = knownRowCount ?? -1;

	const handleRowClick: GridEventListener<"rowClick"> = (params, event) => {
		handleDataGridRowClick({
			params,
			event,
			rowModesModel,
			type,
			navigate,
		});
	};
	const handleSelectionChange = useCallback(
		(newSelection: GridRowSelectionModel, details: any) => {
			setSelectionModel(newSelection);
			if (onRowSelectionModelChange) {
				onRowSelectionModelChange(newSelection, details);
			}
		},
		[onRowSelectionModelChange],
	);
	//identifier may not be needed
	return (
		<div style={{ display: "flex", flexDirection: "column" }}>
			<DataGridPremium
				{...rest}
				rows={rows}
				rowModesModel={rowModesModel}
				paginationMode={paginationMode}
				loading={loading}
				pageSizeOptions={[5, 10, 15, 25, 50, 100, 200]}
				rowCount={paginationMode === "server" ? resolvedRowCount : undefined}
				apiRef={apiRef}
				getRowHeight={autoRowHeight ? () => "auto" : () => null}
				listView={listViewEnabled}
				pivotActive={pivotingEnabled}
				showToolbar={toolbarVisible}
				rowSelectionModel={selectionModel}
				onRowSelectionModelChange={handleSelectionChange}
				onRowClick={handleRowClick}
				onCellDoubleClick={(params, event) => {
					event.defaultMuiPrevented = true;
				}}
				disableRowSelectionExcludeModel
				localeText={{
					toolbarQuickFilterPlaceholder: searchText ?? t("general.search"),
					columnsManagementSearchTitle: t("ui.data_grid.find_column"),
					toolbarExportCSV: t("ui.data_grid.export.current"),
					toolbarExportPrint: t("ui.data_grid.print_current_page"),
					filterOperatorDoesNotEqual: t("ui.data_grid.filters.not_equal"),
					"filterOperator!=": t("ui.data_grid.filters.not_equal"),
					"filterOperator=": t("ui.data_grid.filters.equals"),
					"filterOperator>": t("ui.data_grid.filters.greater_than_exclusive"),
					"filterOperator>=": t("ui.data_grid.filters.greater_than_inclusive"),
					"filterOperator<": t("ui.data_grid.filters.less_than_exclusive"),
					"filterOperator<=": t("ui.data_grid.filters.less_than_inclusive"),
				}}
				onProcessRowUpdateError={(error: any) => {
					console.error("Error updating row:", error);

					// Whatever is throwing the error must include the row name for us to grab it here

					const name = error?.rowName || t("general.this_item", "this item");

					setAlert({
						open: true,
						severity: "error",
						text: t("ui.data_grid.edit_error", {
							entity:
								type === "ReferenceValueMapping"
									? t("mappings.ref_value_one").toLowerCase()
									: type === "NumericRangeMapping"
										? t("mappings.num_range_one").toLowerCase()
										: type?.toLowerCase(),
							name: name,
						}),
					});
				}}
				slots={{
					detailPanelExpandIcon: GridExpandMoreIcon,
					detailPanelCollapseIcon: GridExpandLessIcon,
					noRowsOverlay: () => (
						<NoResultsOverlay noResultsMessage={noResultsText} />
					),
					noResultsOverlay: () => (
						<NoResultsOverlay noResultsMessage={noResultsText} />
					),
					// ExportToolbar already branches internally on type === "patronRequests"
					// for which export menu items to show, so it's a safe universal
					// toolbar - was previously only wired for patronRequests grids,
					// silently leaving every other grid on MUI's stock GridToolbar
					// (losing the custom export/cleanup options).
					toolbar: ExportToolbar,
				}}
				slotProps={{
					toolbar: {
						showQuickFilter: false,
						handleExport, // three-scope server export (or legacy onExport)
						excelOptions: { disableToolbarButton: true },
						allDataLoading: exportConfig
							? exportProgress.isExporting
							: isExporting,
						type: type, // Pass type to determine menu options
						onCleanup: enableCleanup ? onCleanup : undefined, // Pass cleanup handler
						selectionCount: selectionModel?.ids?.size || 0,
						wizardEnabled: exportConfig?.wizard,
						onOpenWizard: () => setWizardOpen(true),
					},
					filterPanel: expandedFilterPanel
						? {
								sx: {
									"& .MuiDataGrid-filterFormValueInput": { minWidth: 420 }, // ideally this would be dynamic. something stopping the date-time-range picker from accepting this. If it can't be dynamic it should only apply to grids of that nature
								},
							}
						: undefined,
				}}
				// Remember this grid is still used for editing. So check functionality has been preserved in the migration.

				sx={{
					border: "0",
					minHeight: rows?.length === 0 ? "400px" : undefined, // ensures that if there's nothing there, we still see loading etc
					"@media print": {
						".MuiDataGrid-main": { color: "rgba(0, 0, 0, 0.87)" },
					},
					// "& .MuiDataGrid-cell--editable": {
					// 	bgcolor: theme.palette.primary.editableFieldBackground,
					// }, // How to signal editable cells.
					".MuiDataGrid-virtualScroller": {
						overflow: scrollbarVisible ? "" : "hidden",
					},
					// both hover styles need to be added, otherwise a flashing effect appears when hovering
					// https://stackoverflow.com/questions/76563478/disable-hover-effect-on-mui-datagrid
					"& .MuiDataGrid-row.Mui-hovered": {
						backgroundColor: disableHoverInteractions ? "transparent" : "",
					},
					"& .MuiDataGrid-row:hover": {
						backgroundColor: disableHoverInteractions ? "transparent" : "",
					},
					"& .MuiDataGrid-cell:focus": {
						outline: disableHoverInteractions ? "none" : "",
					},
					"& .MuiDataGrid-detailPanel": {
						overflow: "hidden", // Prevent scrollbars in the detail panel
						height: "auto", // Adjust height automatically
					},
					// CUSTOM OVERRIDES (will merge with and override base styles so be careful)
					...styleOverrides,
				}}
			/>
			{exportConfig?.wizard ? (
				<ExportWizard
					open={wizardOpen}
					onClose={() => setWizardOpen(false)}
					columns={exportColumns}
					columnVisibilityModel={
						(rest.columnVisibilityModel as GridColumnVisibilityModel) ?? {}
					}
					selectedCount={selectionModel?.ids?.size || 0}
					onExport={runExport}
				/>
			) : null}
			<ExportProgressDialog
				open={exportProgress.isExporting}
				progress={exportProgress.progress}
				totalRecords={exportProgress.totalRecords}
			/>
			<TimedAlert
				open={alert.open}
				severityType={alert.severity}
				autoHideDuration={6000}
				alertText={alert.text}
				onCloseFunc={() => setAlert({ ...alert, open: false })}
			/>
		</div>
	);
}
