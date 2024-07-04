import Link from "@components/Link/Link";
import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
// Import styled separately because of this issue https://github.com/vercel/next.js/issues/55663 - should be fixed in Next 13.5.5
import {
	DataGridPro as MUIDataGrid,
	GridToolbar,
	GridEventListener,
	GridToolbarQuickFilter,
} from "@mui/x-data-grid-pro";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
// This is our generic DataGrid component. Customisation can be carried out either on the props, or within this component based on type.
// For editing, see here https://mui.com/x/react-data-grid/editing/#confirm-before-saving
// This is our Data Grid for the Details pages, which still require client-side pagination.
// For example, displaying Agency Group Members.
const StyledOverlay = styled("div")(() => ({
	display: "flex",
	flexDirection: "column",
	alignItems: "center",
	justifyContent: "center",
	height: "100%",
}));

function SearchOnlyToolbar() {
	return (
		<Box
			sx={{
				p: 0.5,
				pb: 0,
			}}
		>
			<GridToolbarQuickFilter />
		</Box>
	);
}

export default function ClientDataGrid<T extends object>({
	data = [],
	columns,
	type,
	selectable,
	// slots,
	noDataTitle,
	noDataMessage,
	noDataLink,
	columnVisibilityModel,
	sortModel,
	toolbarVisible,
	disableHoverInteractions,
}: {
	data: Array<T>;
	columns: any;
	type: string;
	selectable: boolean;
	slots?: any;
	noDataTitle?: string;
	noDataMessage?: string;
	noDataLink?: string;
	columnVisibilityModel?: any;
	sortModel?: any;
	toolbarVisible?: string;
	disableHoverInteractions?: boolean;
}) {
	// The slots prop allows for customisation https://mui.com/x/react-data-grid/components/
	// This overlay displays when there is no data in the grid.
	// It takes a title, message, and if needed a link for the user to take action.
	// These must be supplied as props for each usage of the DataGrid that wishes to use them,
	// or a blank screen will be displayed.
	const { t } = useTranslation();
	function CustomNoDataOverlay() {
		return (
			<StyledOverlay>
				<Box>
					<Typography variant="body1"> {noDataTitle} </Typography>
					{noDataLink ? (
						<Link href={noDataLink}> {noDataMessage} </Link>
					) : (
						<Typography variant="body1"> {noDataMessage} </Typography>
					)}
				</Box>
			</StyledOverlay>
		);
	}

	const router = useRouter();

	// If audit, allow a click-through so the user can access more audit info
	const handleRowClick: GridEventListener<"rowClick"> = (params, event) => {
		if (type == "Audit") {
			event.ctrlKey || event.metaKey
				? window.open(`/patronRequests/audits/${params?.row?.id}`, "_blank")
				: router.push(`/patronRequests/audits/${params?.row?.id}`);
		} else if (type == "libraryGroupMembers") {
			event.ctrlKey || event.metaKey
				? window.open(`/libraries/${params?.row?.id}`)
				: router.push(`/libraries/${params?.row?.id}`);
		} else if (type == "groupsOfLibrary") {
			event.ctrlKey || event.metaKey
				? window.open(`/groups/${params?.row?.id}`)
				: router.push(`/groups/${params?.row?.id}`);
		}
	};
	function getIdOfRow(row: any) {
		if (type == "bibRecordCountByHostLMS") {
			return row.sourceSystemId;
		} else {
			return row.id;
		}
	}

	return (
		<div>
			<MUIDataGrid
				// Makes sure scrollbars aren't visible
				sx={{
					border: "0",
					"@media print": {
						".MuiDataGrid-main": { color: "rgba(0, 0, 0, 0.87)" },
					},
					".MuiDataGrid-virtualScroller": {
						overflow: "hidden",
					},
					// this styling only applies to a wrapper that appears when there is no data
					".MuiDataGrid-overlayWrapper": {
						minHeight: 100,
						minWidth: "100%",
						textAlign: "center",
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
				}}
				//DCB-396 (https://mui.com/x/react-data-grid/accessibility/#accessibility-changes-in-v7)
				experimentalFeatures={{ ariaV7: true }}
				checkboxSelection={selectable}
				pagination
				disableRowSelectionOnClick
				onRowClick={handleRowClick}
				initialState={{
					filter: {
						// initiate the filter models here
						filterModel: {
							items: [],
							// So we don't search hidden columns and confuse the user
							quickFilterExcludeHiddenColumns: true,
						},
					},
					pagination: {
						paginationModel: { pageSize: 25, page: 0 },
					},
					// Handles whether columns are visible or not - pass the relevant model in (see requests)
					columns: {
						columnVisibilityModel,
					},
					// Handles default sort order- pass the relevant model in (see requests)
					sorting: {
						sortModel,
					},
				}}
				// if we don't want to filter by a column, set filterable to false (turned on by default)
				// And if we want to hide columns, pass the visibility model in
				columns={columns}
				columnVisibilityModel={columnVisibilityModel}
				// we can make our own custom toolbar if necessary, potentially extending the default GridToolbar. Just pass it in here
				rows={data ?? []}
				getRowId={getIdOfRow}
				// And if we ever need to distinguish between no data and no results (i.e. from search) we'd just pass different overlays here.
				slots={{
					toolbar:
						toolbarVisible != "not-visible" && toolbarVisible != "search-only"
							? GridToolbar
							: toolbarVisible == "search-only"
								? SearchOnlyToolbar
								: null,
					noRowsOverlay: CustomNoDataOverlay,
					noResultsOverlay: CustomNoDataOverlay,
				}}
				// and we can also pass a custom footer component in 'slots'. This might work for NewGroup or addAgency buttons
				slotProps={{
					toolbar: {
						showQuickFilter: true,
					},
				}}
				localeText={{
					toolbarExportCSV: t("datagrid.download_current_page"),
					toolbarExportPrint: t("datagrid.print_current_page"),
				}}
			></MUIDataGrid>
		</div>
	);
}
