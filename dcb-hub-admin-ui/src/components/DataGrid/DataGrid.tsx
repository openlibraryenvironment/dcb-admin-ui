import {
	DataGridPremium,
	DataGridPremiumProps,
	GridApiPremium,
	GridColDef,
	GridColumnVisibilityModel,
	GridEventListener,
	GridExpandLessIcon,
	GridExpandMoreIcon,
	GridFeatureMode,
	GridFilterModel,
	GridPaginationModel,
	GridRowModes,
	GridRowModesModel,
	GridRowParams,
	GridRowSelectionModel,
	GridRowsProp,
	GridSortModel,
	GridToolbar,
	useGridApiRef,
} from "@mui/x-data-grid-premium";
import { RefObject, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { NoResultsOverlay } from "./components/NoResultsOverlay";
import { useNavigate } from "@tanstack/react-router";
import { SxProps, Theme } from "@mui/material";
import ExportToolbar from "./components/ExportToolbar";
import {
	expandedFilterPanelTypes,
	nonClickableTypes,
	specialRedirectionTypes,
} from "@constants/dataGrid/types";
import { handleDataGridRowClick } from "@helpers/dataGrid/handleDataGridRowClick";
import TimedAlert from "@components/TimedAlert/TimedAlert";
// Needs reviewing for consortial needs
// check persistent storage
// use grid actions as editing is more of a priority
// custom click path

declare module "@mui/x-data-grid-premium" {
	interface ToolbarPropsOverrides {
		handleExport?: (fileType: string, exportMode: string) => Promise<void>;
		allDataLoading?: boolean;
		type?: string;
		onCleanup?: () => void;
		selectionCount?: number;
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
}

interface DataGridProps {
	autoRowHeight?: boolean;
	checkboxSelection: boolean;
	columns: GridColDef[];
	columnVisibilityModel?: GridColumnVisibilityModel;
	disableAggregation: boolean;
	disableHoverInteractions: boolean;
	disablePivoting: boolean;
	disableRowGrouping: boolean;
	editMode?: "cell" | "row"; // Determines cell or row editing
	filterMode: GridFeatureMode; // Determines client or server-side filtering
	filterModel?: GridFilterModel;
	getDetailPanelContent?: any; // Function for returning detail panel content, where applicable
	identifier: string; // The specific type or identifier. Must be unique in the application, as it is used to retrieve data grid settings.
	loading: boolean;
	listViewEnabled: boolean;
	noResultsText: string;
	onColumnVisibilityModelChange?: (model: GridColumnVisibilityModel) => void;
	onFilterModelChange?: (model: GridFilterModel) => void;
	// onPaginationModelChange: (model: GridPaginationModel) => void;
	onPaginationModelChange?: any;
	onRowModesModelChange?: (model: GridRowModesModel) => void;
	onRowEditStop?: (params: any, event: any) => void;
	onSortModelChange?: (model: GridSortModel) => void;
	pagination: boolean;
	paginationMode: GridFeatureMode; // Determines client or server side pagination
	paginationModel: GridPaginationModel;
	pivotingEnabled: boolean;
	processRowUpdate?: (newRow: any, oldRow: any) => Promise<any> | any;
	rowCount?: number;
	rowModesModel: GridRowModesModel;
	rows: GridRowsProp;
	scrollbarVisible: boolean;
	// sortModel: GridSortModel;
	sortModel?: any;
	sortingMode: GridFeatureMode;
	toolbarVisible: boolean;
	searchText: string;
	styleOverrides?: SxProps<Theme>; // If you are providing style overrides for the Data Grid, you MUST include all styles as this will override everything specified by default in sx
	type: string; // The general type - i.e. "Locations"
	parentApiRef?: RefObject<GridApiPremium | null>;
	enableCleanup?: boolean;
	onCleanup?: () => void;
	onExport?: (fileType: string, exportMode: string) => Promise<void>;
	isExporting?: boolean;
}
// export default function DataGrid({
// 	autoRowHeight,
// 	checkboxSelection,
// 	columns,
// 	columnVisibilityModel,
// 	disableAggregation,
// 	disableHoverInteractions,
// 	disablePivoting,
// 	disableRowGrouping,
// 	editMode,
// 	enableCleanup,
// 	filterMode,
// 	filterModel,
// 	getDetailPanelContent,
// 	isExporting = false,
// 	loading,
// 	listViewEnabled,
// 	noResultsText,
// 	onCleanup,
// 	onColumnVisibilityModelChange,
// 	onExport,
// 	onFilterModelChange,
// 	onPaginationModelChange,
// 	onRowModesModelChange,
// 	onRowEditStop,
// 	onSortModelChange,
// 	pagination,
// 	paginationMode,
// 	paginationModel,
// 	parentApiRef,
// 	pivotingEnabled,
// 	processRowUpdate,
// 	rowCount,
// 	rowModesModel,
// 	rows,
// 	scrollbarVisible,
// 	sortModel,
// 	sortingMode,
// 	styleOverrides,
// 	searchText,
// 	toolbarVisible,
// 	type,
// }: DataGridProps) {
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
	paginationMode,
	rowCount,
	rowModesModel = IMMUTABLE_FALLBACK_MODES,
	rows,
	...rest
}: CustomDataGridProps) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const expandedFilterPanel = expandedFilterPanelTypes.includes(type);
	const getDetailPanelHeight = useCallback(() => "auto", []); // Only necessary because master detail is not applicable to all grids yet
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
		(newSelection: GridRowSelectionModel) => {
			setSelectionModel(newSelection);
		},
		[],
	);
	//identifier may not be needed
	return (
		<div style={{ display: "flex", flexDirection: "column" }}>
			<DataGridPremium
				{...rest}
				rows={rows}
				rowModesModel={rowModesModel}
				paginationMode={paginationMode}
				rowCount={paginationMode === "server" ? rowCount : undefined}
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
					toolbarExportPrint: t("ui.data_grid.export.print"),
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
					toolbar: type === "patronRequests" ? ExportToolbar : GridToolbar, // rely on this for now. develop our own 'standard custom' toolbar by v9
				}}
				slotProps={{
					toolbar: {
						showQuickFilter: false,
						handleExport: onExport, // Pass the export handler
						excelOptions: { disableToolbarButton: true },
						allDataLoading: isExporting, // Pass the loading state
						type: type, // Pass type to determine menu options
						onCleanup: enableCleanup ? onCleanup : undefined, // Pass cleanup handler
						selectionCount: selectionModel?.ids?.size || 0,
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
