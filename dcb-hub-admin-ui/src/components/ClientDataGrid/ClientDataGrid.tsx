import Link from "@components/Link/Link";
import { Box, Tooltip, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
// Import styled separately because of this issue https://github.com/vercel/next.js/issues/55663 - should be fixed in Next 13.5.5
import {
	DataGridPro as MUIDataGrid,
	GridToolbar,
	GridEventListener,
	GridToolbarQuickFilter,
	useGridApiRef,
	GridRowModel,
	GridColDef,
	GridActionsCellItem,
	GridRowModes,
	GridRowId,
	GridRowModesModel,
	GridRenderEditCellParams,
} from "@mui/x-data-grid-pro";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { useCallback, useState } from "react";
import { useMutation } from "@apollo/client/react";
import { updatePerson } from "src/queries/queries";
import { Cancel, Edit, Save, Visibility } from "@mui/icons-material";
import Confirmation from "@components/Upload/Confirmation/Confirmation";
import { DocumentNode } from "graphql";
import TimedAlert from "@components/TimedAlert/TimedAlert";
import { formatChangedFields } from "src/helpers/formatChangedFields";
import { useSession } from "next-auth/react";
import { CellEdit } from "@components/CellEdit/CellEdit";
import { ColumnsAndSearchToolbar } from "@components/ServerPaginatedGrid/components/ColumnsAndSearchToolbar";
// This is our generic DataGrid component. Customisation can be carried out either on the props, or within this component based on type.
// For editing, see here https://mui.com/x/react-data-grid/editing/#confirm-before-saving
// This is our Data Grid for the Details pages, which still require client-side pagination.
// For example, displaying Agency Group Members.
// A long term goal is to unite this with the ServerPaginatedGrid due to the amount of shared code.
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

function computeMutation(newRow: GridRowModel, oldRow: GridRowModel) {
	const changedFields: Partial<GridRowModel> = {};
	const originalFields: Partial<GridRowModel> = {};

	Object.keys(newRow).forEach((key) => {
		if (newRow[key] !== oldRow[key]) {
			changedFields[key] = newRow[key];
			originalFields[key] = oldRow[key];
		}
	});

	if (Object.keys(changedFields).length > 0) {
		return formatChangedFields(changedFields, originalFields);
	}
	return null;
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
	editQuery,
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
	editQuery?: DocumentNode;
}) {
	// The slots prop allows for customisation https://mui.com/x/react-data-grid/components/
	// This overlay displays when there is no data in the grid.
	// It takes a title, message, and if needed a link for the user to take action.
	// These must be supplied as props for each usage of the DataGrid that wishes to use them,
	// or a blank screen will be displayed.
	const { t } = useTranslation();
	const { data: session }: { data: any } = useSession();
	const apiRef = useGridApiRef(); // Use the API ref to access editing, etc
	const router = useRouter();

	const [promiseArguments, setPromiseArguments] = useState<any>(null);

	const [updateRow] = useMutation(editQuery ?? updatePerson);
	const [editRecord, setEditRecord] = useState<any>(null);
	const [alert, setAlert] = useState<any>({
		open: false,
		severity: "success",
		text: null,
	});

	const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
	const isAnyRowEditing = useCallback(() => {
		return Object.values(rowModesModel).some(
			(modeItem) => modeItem.mode === GridRowModes.Edit,
		);
	}, [rowModesModel]);

	const handleEditClick = (id: GridRowId) => () => {
		setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
		// This ensures focus goes to the first editable field.
		const firstEditableField = findFirstEditableColumn();
		if (firstEditableField) {
			// Use setTimeout to ensure the cell is in edit mode before focusing
			setTimeout(() => {
				apiRef.current.setCellFocus(id, firstEditableField);
			}, 0);
		}
	};
	const findFirstEditableColumn = useCallback(() => {
		const editableColumns = apiRef.current
			.getAllColumns()
			.filter((column) => column.editable);
		return editableColumns.length > 0 ? editableColumns[0].field : null;
	}, [apiRef]);

	const handleSaveClick = (id: GridRowId) => () => {
		setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
	};

	const handleCancelClick = (id: GridRowId) => () => {
		setRowModesModel({
			...rowModesModel,
			[id]: { mode: GridRowModes.View, ignoreModifications: true },
		});
	};

	const processRowUpdate = useCallback(
		(newRow: GridRowModel, oldRow: GridRowModel) =>
			new Promise<GridRowModel>((resolve, reject) => {
				const mutation = computeMutation(newRow, oldRow);
				if (mutation) {
					setEditRecord(mutation);
					setPromiseArguments({ resolve, reject, newRow, oldRow });
				} else {
					resolve(oldRow); // Nothing was changed
				}
			}),
		[],
	);

	const handleRowModesModelChange = (newRowModesModel: GridRowModesModel) => {
		setRowModesModel(newRowModesModel);
	};

	const isAnAdmin = session?.profile?.roles?.some(
		(role: string) => role === "ADMIN" || role === "CONSORTIUM_ADMIN",
	);

	const handleNo = () => {
		const { oldRow, resolve } = promiseArguments;
		resolve(oldRow); // Resolve with the old row to not update the internal state
		setPromiseArguments(null);
	};

	const handleYes = async () => {
		const { newRow, oldRow, reject, resolve } = promiseArguments;
		// This will need to be built conditionally for different types etc
		// Person-only at the minute.
		const input = {
			id: newRow.id, // This will be a constant as it's always required.
			email: newRow.email,
			firstName: newRow.firstName,
			lastName: newRow.lastName,
			role: newRow.role,
			isPrimaryContact: newRow.isPrimaryContact,
			// fullName: newRow.fullName,
			// abbreviatedName: newRow.abbreviatedName,
		};

		try {
			// Make the GraphQL mutation to update the row. Variables will need to be conditional.
			const { data } = await updateRow({
				variables: { input },
			});
			setAlert({
				open: true,
				severity: "success",
				text: t("ui.data_grid.edit_success", { entity: type, name: "" }),
				title: t("ui.data_grid.updated"),
			});
			resolve(data.updatePerson);
			setPromiseArguments(null);
		} catch (error) {
			setAlert({
				open: true,
				severity: "error",
				text: t("ui.data_grid.edit_error", { entity: type, name: "" }),
				title: t("ui.data_grid.updated"),
			});
			reject(oldRow);
			setPromiseArguments(null);
		}
	};

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

	// If certain types, allow a click-through so the user can access more info
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
		} else if (type == "patronRequestsForLocation") {
			event.ctrlKey || event.metaKey
				? window.open(`/patronRequests/${params?.row?.id}`, "_blank")
				: router.push(`/patronRequests/${params?.row?.id}`);
		}
	};
	function getIdOfRow(row: any) {
		if (type == "bibRecordCountByHostLMS") {
			return row.sourceSystemId;
		} else {
			return row.id;
		}
	}
	const actionsColumn: GridColDef[] = [
		{
			field: "actions",
			type: "actions",
			// renderHeader: ActionsColumnHeader, // Add custom header
			getActions: ({ id }) => {
				const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;
				if (isInEditMode) {
					return [
						<Tooltip
							title={t("ui.data_grid.save")}
							key={t("ui.data_grid.save")}
						>
							<GridActionsCellItem
								icon={<Save />}
								label={t("ui.data_grid.save")}
								key={t("ui.data_grid.save")}
								onClick={handleSaveClick(id)}
							/>
						</Tooltip>,
						<Tooltip
							title={t("ui.data_grid.cancel")}
							key={t("ui.data_grid.cancel")}
						>
							<GridActionsCellItem
								icon={<Cancel />}
								label={t("ui.data_grid.cancel")}
								key={t("ui.data_grid.cancel")}
								onClick={handleCancelClick(id)}
							/>
						</Tooltip>,
					];
				}
				return [
					<GridActionsCellItem
						key="Open"
						showInMenu
						disabled={
							!(
								type === "libraryGroupMembers" ||
								type === "groupsOfLibrary" ||
								type == "libraryGroupMembers"
							) || isAnyRowEditing()
						}
						icon={<Visibility />}
						onClick={() => {
							// Some grids, like the PRs on the library page, need special redirection
							if (type == "Audit") {
								router.push(`/patronRequests/audits/${id}`);
							} else if (type == "libraryGroupMembers") {
								router.push(`/libraries/${id}`);
							} else if (type == "groupsOfLibrary") {
								router.push(`/groups/${id}`);
							}
						}}
						label={t("ui.data_grid.open")}
					/>,
					<GridActionsCellItem
						key="Edit"
						icon={<Edit />}
						label={t("ui.data_grid.edit")}
						onClick={handleEditClick(id)}
						showInMenu
						disabled={!isAnAdmin || isAnyRowEditing()}
					/>,
				];
			},
		},
	];
	const allColumns = (editQuery ? [...columns, ...actionsColumn] : columns).map(
		(col: any) => ({
			...col,
			renderEditCell: (params: GridRenderEditCellParams) => (
				<CellEdit {...params} />
			),
		}),
	);

	// fix no data overlay - broken somehow.
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
				checkboxSelection={selectable}
				pagination
				disableRowSelectionOnClick
				onRowClick={handleRowClick}
				rowModesModel={rowModesModel}
				onRowModesModelChange={handleRowModesModelChange}
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
				columns={allColumns}
				autoHeight
				columnVisibilityModel={columnVisibilityModel}
				// we can make our own custom toolbar if necessary, potentially extending the default GridToolbar. Just pass it in here
				rows={data ?? []}
				processRowUpdate={processRowUpdate}
				onProcessRowUpdateError={(error) => {
					console.error("Error updating row:", error);
					setAlert({
						open: true,
						severity: "error",
						text: t("ui.data_grid.edit_error", { entity: type, library: "" }),
					});
				}}
				apiRef={apiRef}
				getRowId={getIdOfRow}
				editMode="row"
				onCellDoubleClick={(params, event) => {
					// Prevent default double-click edit behavior
					event.defaultMuiPrevented = true;
				}}
				// And if we ever need to distinguish between no data and no results (i.e. from search) we'd just pass different overlays here.
				slots={{
					toolbar:
						toolbarVisible === "search-columns"
							? ColumnsAndSearchToolbar
							: toolbarVisible === "search-only"
								? SearchOnlyToolbar
								: toolbarVisible == "not-visible"
									? null
									: GridToolbar, // Grid toolbar is default.
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
					toolbarExportCSV: t("ui.data_grid.download_current_page"),
					toolbarExportPrint: t("ui.data_grid.print_current_page"),
				}}
			></MUIDataGrid>
			<Confirmation
				open={!!promiseArguments}
				onClose={handleNo}
				onConfirm={handleYes}
				type="gridEdit"
				editInformation={editRecord}
				entity={type}
			/>

			<TimedAlert
				open={alert.open}
				severityType={alert.severity}
				autoHideDuration={6000}
				alertText={alert.text}
				onCloseFunc={() => setAlert({ ...alert, open: false })}
				alertTitle={alert.title}
			/>
		</div>
	);
}
