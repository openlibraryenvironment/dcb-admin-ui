import { Tooltip } from "@mui/material";
// Import styled separately because of this issue https://github.com/vercel/next.js/issues/55663 - should be fixed in Next 13.5.5
import {
	DataGridPremium,
	GridToolbar,
	GridEventListener,
	useGridApiRef,
	GridRowModel,
	GridColDef,
	GridActionsCellItem,
	GridRowModes,
	GridRowId,
	GridRowModesModel,
	GridRenderEditCellParams,
	GridSortModel,
	GridColumnVisibilityModel,
	GridRowParams,
} from "@mui/x-data-grid-premium";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { useCallback, useState } from "react";
import { useMutation } from "@apollo/client/react";
import { deleteLibraryContact, updatePerson } from "src/queries/queries";
import { Cancel, Delete, Edit, Save, Visibility } from "@mui/icons-material";
import Confirmation from "@components/Upload/Confirmation/Confirmation";
import { DocumentNode } from "graphql";
import TimedAlert from "@components/TimedAlert/TimedAlert";
import { formatChangedFields } from "src/helpers/formatChangedFields";
import { useSession } from "next-auth/react";
import { CellEdit } from "@components/CellEdit/CellEdit";
import { ColumnsAndSearchToolbar } from "@components/ServerPaginatedGrid/components/ColumnsAndSearchToolbar";
import { validateRow } from "src/helpers/DataGrid/validateRow";
import { findFirstEditableColumn } from "src/helpers/DataGrid/findFirstEditableColumn";
import { getIdOfRow } from "src/helpers/DataGrid/getIdOfRow";
import { useGridStore } from "@hooks/useDataGridOptionsStore";
import { getEntityText } from "src/helpers/DataGrid/getEntityText";
import {
	CustomNoDataOverlay,
	CustomNoResultsOverlay,
} from "@components/ServerPaginatedGrid/components/DynamicOverlays";
import SearchOnlyToolbar from "@components/ServerPaginatedGrid/components/SearchOnlyToolbar";
// This is our generic DataGrid component. Customisation can be carried out either on the props, or within this component based on type.
// For editing, see here https://mui.com/x/react-data-grid/editing/#confirm-before-saving
// This is our Data Grid for the Details pages, which still require client-side pagination.
// For example, displaying Agency Group Members.
// A long term goal is to unite this with the ServerPaginatedGrid due to the amount of shared code.

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
	coreType,
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
	deleteQuery,
	refetchQuery,
	loading,
	operationDataType,
	autoRowHeight,
	disableAggregation,
	disableRowGrouping,
	parentEntityId,
}: {
	data: Array<T>;
	columns: any;
	type: string;
	coreType: string;
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
	deleteQuery?: DocumentNode;
	refetchQuery?: string[];
	loading?: boolean;
	operationDataType: string;
	autoRowHeight?: boolean;
	disableAggregation: boolean;
	disableRowGrouping: boolean;
	parentEntityId?: string;
}) {
	// The slots prop allows for customisation https://mui.com/x/react-data-grid/components/
	// This overlay displays when there is no data in the grid.
	// It takes a title, message, and if needed a link for the user to take action.
	// These must be supplied as props for each usage of the DataGrid that wishes to use them,
	// or a blank screen will be displayed.
	const {
		sortOptions: storedSortOptions,
		// filterOptions: storedFilterOptions,
		// paginationModel: storedPaginationModel,
		columnVisibility: storedColumnVisibility,
		setSortOptions,
		// setFilterOptions,
		// setPaginationModel,
		setColumnVisibility,
	} = useGridStore();
	const { t } = useTranslation();
	const { data: session }: { data: any } = useSession();
	const apiRef = useGridApiRef(); // Use the API ref to access editing, etc
	const router = useRouter();

	const [promiseArguments, setPromiseArguments] = useState<any>(null);
	const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);

	const [entityToDelete, setEntityToDelete] = useState<string | null>(null);
	const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
	const [deleteAlertSeverity, setDeleteAlertSeverity] = useState<
		"success" | "error"
	>("success");
	const [deleteAlertText, setDeleteAlertText] = useState("");

	const [updateRow] = useMutation(editQuery ?? updatePerson);
	const [deleteEntity] = useMutation(deleteQuery ?? deleteLibraryContact, {
		refetchQueries: refetchQuery ?? ["LoadLibraries"],
	});
	const [sortOptions, setSortOptionsState] = useState({
		field: storedSortOptions[type]?.field,
		direction: storedSortOptions[type]?.direction,
	});
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

	const handleSortModelChange = useCallback(
		(sortModel: GridSortModel) => {
			// sortDirection and sortAttributes are our defaults, passed in from each instance.
			// They are intended for use on first load, or if the sortModel value is ever null or undefined.
			const newField = sortModel[0]?.field;
			const newDirection = sortModel[0]?.sort?.toUpperCase() ?? "";
			setSortOptionsState({
				field: newField,
				direction: newDirection,
			});
			setSortOptions(type, newField, newDirection);
		},
		[setSortOptions, type],
	);
	const handleColumnVisibilityModelChange = (
		newModel: GridColumnVisibilityModel,
	) => {
		setColumnVisibility(type, newModel);
	};

	const handleEditClick = (id: GridRowId) => () => {
		setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
		// This ensures focus goes to the first editable field.
		const firstEditableField = findFirstEditableColumn(apiRef);
		if (firstEditableField) {
			// Use setTimeout to ensure the cell is in edit mode before focusing
			setTimeout(() => {
				apiRef.current.setCellFocus(id, firstEditableField);
			}, 0);
		}
	};

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
				const editableColumns = apiRef.current
					.getAllColumns()
					.filter((column) => column.editable);
				const rowValidationResult = validateRow(
					newRow,
					oldRow,
					editableColumns,
				);
				if (rowValidationResult) {
					setAlert({
						open: true,
						severity: "error",
						text: t(rowValidationResult.translationKey, {
							field: rowValidationResult.field,
						}),
					});
					resolve(oldRow);
					return;
				}
				const mutation = computeMutation(newRow, oldRow);
				// Handle role change as change to role.name
				if (mutation) {
					setEditRecord(mutation);
					setPromiseArguments({ resolve, reject, newRow, oldRow });
				} else {
					resolve(oldRow); // Nothing was changed
				}
			}),
		[apiRef, t],
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

	const handleYes = async (
		reason: string,
		changeCategory: string,
		changeReferenceUrl: string,
	) => {
		const { newRow, oldRow, reject, resolve } = promiseArguments;
		const input: Record<string, any> = {
			id: newRow.id,
			reason: reason,
			changeCategory: changeCategory,
			changeReferenceUrl: changeReferenceUrl,
		};

		// Dynamically build the input object based on changed fields
		// But don't send the whole role object
		Object.keys(newRow).forEach((key) => {
			if (newRow[key] !== oldRow[key]) {
				if (key == "role") {
					input[key] = newRow[key].name;
				} else {
					input[key] = newRow[key];
				}
			}
		});
		const updateName = "update" + operationDataType;
		const name =
			apiRef.current.getRow(newRow.id).name ??
			apiRef.current.getRow(newRow.id).fullName;
		try {
			// Await the updateRow mutation
			const { data } = await updateRow({
				variables: { input },
			});
			setAlert({
				open: true,
				severity: "success",
				title: t("ui.data_grid.updated"),
				text: t("ui.data_grid.edit_success", {
					entity: t(getEntityText(operationDataType)).toLowerCase(),
					name: name ?? "",
				}),
			});
			resolve(data[updateName]);
			setPromiseArguments(null);
		} catch (error) {
			setAlert({
				open: true,
				severity: "error",
				text: t("ui.data_grid.edit_error", {
					entity: t(getEntityText(operationDataType)).toLowerCase(),
					name: name ?? "",
				}),
			});
			reject(oldRow);
			setPromiseArguments(null);
		}
	};
	const handleDeleteEntity = async (
		id: string,
		reason: string,
		changeCategory: string,
		changeReferenceUrl: string,
		operationDataType?: string,
	) => {
		const name =
			apiRef.current.getRow(id).name ?? apiRef.current.getRow(id).fullName;
		try {
			const baseInput = {
				id: id,
				reason: reason,
				changeCategory: changeCategory,
				changeReferenceUrl: changeReferenceUrl,
			};
			const libraryContactInput = {
				personId: id,
				libraryId: parentEntityId,
				reason: reason,
				changeCategory: changeCategory,
				changeReferenceUrl: changeReferenceUrl,
			};
			const consortiumContactInput = {
				personId: id,
				consortiumId: parentEntityId,
				reason: reason,
				changeCategory: changeCategory,
				changeReferenceUrl: changeReferenceUrl,
			};
			const input =
				coreType == "LibraryContact"
					? libraryContactInput
					: coreType == "ConsortiumContact"
						? consortiumContactInput
						: baseInput;
			const { data } = await deleteEntity({
				variables: {
					input,
				},
			});
			const operation =
				coreType == "ConsortiumContact" ? "deleteContact" : "delete" + coreType;
			if (data?.[operation].success == true) {
				setDeleteAlertSeverity("success");
				setDeleteAlertText(
					t("ui.data_grid.delete_success", {
						entity:
							coreType == "ConsortiumContact" || coreType == "LibraryContact"
								? t("ui.info.contact")
								: operationDataType?.toLowerCase(),
						name: name,
					}),
				);
			} else {
				console.log(data?.[operation]);
				console.log("Failed to delete entity");
				setDeleteAlertSeverity("error");
				setDeleteAlertText(
					t("ui.data_grid.delete_error", {
						entity:
							coreType == "ConsortiumContact" || coreType == "LibraryContact"
								? t("ui.info.contact")
								: operationDataType?.toLowerCase(),
						name: name,
					}),
				);
			}
			setDeleteAlertOpen(true);
		} catch (error) {
			console.error("Error deleting entity:", error);
			setDeleteAlertSeverity("error");
			setDeleteAlertText(
				t("ui.data_grid.delete_error", {
					entity:
						coreType == "ConsortiumContact" || coreType == "LibraryContact"
							? t("ui.info.contact")
							: operationDataType?.toLowerCase(),
					name: name,
				}),
			);
			setDeleteAlertOpen(true);
		}
	};

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

	const openActionTypes = [
		"Audit",
		"libraryGroupMembers",
		"groupsOfLibrary",
		"patronRequestsForLocation",
	];

	const actionsColumn: GridColDef[] = [
		{
			field: "actions",
			type: "actions",
			getActions: (params: GridRowParams) => {
				const id = params?.row?.id;
				const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;
				// List of types that support opening
				const openActionTypes = [
					"Audit",
					"libraryGroupMembers",
					"groupsOfLibrary",
					"patronRequestsForLocation",
				];

				if (isInEditMode) {
					return [
						<Tooltip
							title={t("ui.data_grid.save")}
							key={t("ui.data_grid.save")}
						>
							<GridActionsCellItem
								icon={<Save />}
								label={t("ui.data_grid.save")}
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
								onClick={handleCancelClick(id)}
							/>
						</Tooltip>,
					];
				}

				const actions = [];
				// Only add the open action where it is relevant
				if (openActionTypes.includes(type)) {
					actions.push(
						<GridActionsCellItem
							key="Open"
							showInMenu
							disabled={isAnyRowEditing()}
							icon={<Visibility />}
							onClick={() => {
								if (type == "Audit") {
									router.push(`/patronRequests/audits/${id}`);
								} else if (type == "libraryGroupMembers") {
									router.push(`/libraries/${id}`);
								} else if (type == "groupsOfLibrary") {
									router.push(`/groups/${id}`);
								} else if (type == "patronRequestsForLocation") {
									router.push(`/patronRequests/${id}`);
								}
							}}
							label={t("ui.data_grid.open")}
						/>,
					);
				}
				if (isAnAdmin && editQuery) {
					actions.push(
						<GridActionsCellItem
							key="Edit"
							icon={<Edit />}
							label={t("ui.data_grid.edit")}
							onClick={handleEditClick(id)}
							showInMenu
							disabled={!isAnAdmin || isAnyRowEditing()}
						/>,
					);
				}
				if (isAnAdmin && deleteQuery) {
					actions.push(
						<GridActionsCellItem
							key="Delete"
							icon={<Delete />}
							label={t("ui.data_grid.delete")}
							onClick={() => {
								setConfirmationModalOpen(true);
								setEntityToDelete(id);
							}}
							showInMenu
							disabled={!isAnAdmin || isAnyRowEditing()}
						/>,
					);
				}

				return actions;
			},
		},
	];

	const allColumns = (
		editQuery && isAnAdmin
			? [...columns, ...actionsColumn]
			: openActionTypes.includes(type)
				? [...columns, ...actionsColumn]
				: columns
	).map((col: any) => ({
		...col,
		renderEditCell: (params: GridRenderEditCellParams) => (
			<CellEdit {...params} />
		),
	}));

	// fix no data overlay - broken somehow.
	return (
		<div>
			<DataGridPremium
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
				onSortModelChange={handleSortModelChange}
				disableAggregation={disableAggregation}
				disableRowGrouping={disableRowGrouping}
				initialState={{
					aggregation: {
						model: {
							sourceRecordCount: "sum",
							awaiting: "sum",
							failed: "sum",
							ingested: "sum",
							bibRecordCount: "sum",
							difference: "sum",
						},
					},
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
						columnVisibilityModel:
							storedColumnVisibility[type] || columnVisibilityModel,
					},
					// Handles default sort order- pass the relevant model in (see requests)
					sorting: {
						sortModel: sortOptions.field
							? [
									{
										field: sortOptions.field,
										sort: sortOptions.direction.toLowerCase(),
									},
								]
							: sortModel,
					},
				}}
				// if we don't want to filter by a column, set filterable to false (turned on by default)
				// And if we want to hide columns, pass the visibility model in
				columns={allColumns}
				autoHeight
				loading={loading}
				onColumnVisibilityModelChange={handleColumnVisibilityModelChange}
				// we can make our own custom toolbar if necessary, potentially extending the default GridToolbar. Just pass it in here
				rows={data ?? []}
				processRowUpdate={processRowUpdate}
				onProcessRowUpdateError={(error) => {
					console.error("Error updating row:", error);
					setAlert({
						open: true,
						severity: "error",
						text: t("ui.data_grid.edit_error", {
							entity: t(getEntityText(operationDataType)).toLowerCase(),
						}),
					});
				}}
				apiRef={apiRef}
				getRowId={(row) => getIdOfRow(row, type)}
				getRowHeight={() => {
					if (autoRowHeight) {
						return "auto";
					} else return null;
				}}
				// getRowHeight={autoRowHeight ? () => "auto" : null}
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
					noResultsOverlay: () => (
						<CustomNoResultsOverlay noResultsMessage={noDataMessage} />
					),
					noRowsOverlay: () => (
						<CustomNoDataOverlay
							noDataMessage={noDataMessage}
							noDataLink={noDataLink}
							noDataTitle={noDataTitle}
						/>
					),
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
			/>
			<Confirmation
				open={!!promiseArguments}
				onClose={handleNo}
				onConfirm={handleYes}
				type="gridEdit"
				editInformation={editRecord}
				entity={type}
				gridEdit
			/>
			<Confirmation
				open={confirmationModalOpen}
				onClose={() => setConfirmationModalOpen(false)}
				onConfirm={(reason, changeCategory, changeReferenceUrl) => {
					if (entityToDelete) {
						handleDeleteEntity(
							entityToDelete,
							reason,
							changeCategory,
							changeReferenceUrl,
							operationDataType,
						);
						setConfirmationModalOpen(false);
						setEntityToDelete(null);
					}
				}}
				type={"delete" + coreType}
				entity={operationDataType?.toLowerCase() ?? ""}
				entityId={entityToDelete ?? ""}
				gridEdit
			/>
			<TimedAlert
				open={alert.open}
				severityType={alert.severity}
				autoHideDuration={6000}
				alertText={alert.text}
				onCloseFunc={() => setAlert({ ...alert, open: false })}
				alertTitle={alert.title}
			/>
			<TimedAlert
				open={deleteAlertOpen}
				severityType={deleteAlertSeverity}
				alertText={deleteAlertText}
				alertTitle={t("ui.data_grid.deleted")}
				autoHideDuration={5000}
				onCloseFunc={() => setDeleteAlertOpen(false)}
			/>
		</div>
	);
}
