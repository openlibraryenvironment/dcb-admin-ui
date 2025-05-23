import {
	DataGridPremium,
	GridActionsCellItem,
	GridColDef,
	GridColumnVisibilityModel,
	GridEventListener,
	GridFilterModel,
	GridRenderEditCellParams,
	GridRowId,
	GridRowModel,
	GridRowModes,
	GridRowModesModel,
	GridRowParams,
	GridSortModel,
	gridVisibleColumnFieldsSelector,
	// useGridApiContext, // v8 only
	useGridApiRef, // useGridApiContext inside the data grid, and useGridApiRef outside of it
} from "@mui/x-data-grid-premium";
import {
	DocumentNode,
	useLazyQuery,
	useMutation,
	useQuery,
} from "@apollo/client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import {
	CustomNoDataOverlay,
	CustomNoResultsOverlay,
} from "./components/DynamicOverlays";
import QuickSearchToolbar from "./components/QuickSearchToolbar";
import {
	Cancel,
	Delete,
	Edit,
	Save,
	Visibility,
	ExpandLess,
	ExpandMore,
} from "@mui/icons-material";
import { Tooltip } from "@mui/material";
import { useSession } from "next-auth/react";
import {
	deleteLibraryQuery,
	getLocations,
	getPatronRequestsForExport,
	updateLibraryQuery,
} from "src/queries/queries";
import Confirmation from "@components/Upload/Confirmation/Confirmation";
import TimedAlert from "@components/TimedAlert/TimedAlert";
import { computeMutation } from "src/helpers/computeMutation";
import { CellEdit } from "@components/CellEdit/CellEdit";
import { validateRow } from "src/helpers/DataGrid/validateRow";
import { determineDataGridPathOnClick } from "src/helpers/DataGrid/determineDataGridPathOnClick";
import {
	actionsTypes,
	nonClickableTypes,
	presetTypes,
	quickFieldMap,
	specialRedirectionTypes,
} from "src/constants/dataGridConstants";
import { buildFilterQuery } from "src/helpers/DataGrid/buildFilterQuery";
import { getIdOfRow } from "src/helpers/DataGrid/getIdOfRow";
import { findFirstEditableColumn } from "src/helpers/DataGrid/findFirstEditableColumn";
import { isEmpty } from "lodash";
import { getFileNameForExport } from "src/helpers/DataGrid/getFileNameForExport";
import { convertFileToString } from "src/helpers/DataGrid/convertFileToString";
import ExportToolbar from "./components/ExportToolbar";
import { useGridStore } from "@hooks/useDataGridOptionsStore";
import { adminOrConsortiumAdmin } from "src/constants/roles";
import { PatronRequest } from "@models/PatronRequest";
import { Location } from "@models/Location";
import { ExportProgressDialog } from "./components/ExportProgressDialog";
// Slots that won't change are defined here to stop them from being re-created on every render.
// See https://mui.com/x/react-data-grid/performance/#extract-static-objects-and-memoize-root-props
const staticSlots = {
	toolbar: QuickSearchToolbar,
	detailPanelExpandIcon: ExpandMore,
	detailPanelCollapseIcon: ExpandLess,
};

export default function ServerPaginationGrid({
	query, // The query to fetch data for the grid
	type, // The grid identifier. Used also for saving options on a per-grid basis.
	selectable, // Whether checkbox selection should be allowed or not.
	pageSize, // How many items should be included in a page.
	columns, // Data structure for the grid's columns
	columnVisibilityModel, // Which columns should be visible by default.
	sortModel, // Pre-defined sort model.
	noResultsMessage, // Message to display when there are no results.
	noDataMessage, // Message to display when there is no data available.
	searchPlaceholder, // What text should be displayed in the "Search" bar
	sortDirection, // Which direction the grid should be sorted in.
	sortAttribute, // Which attribute the grid should be sorted by.
	coreType, // The core type of the entity
	scrollbarVisible, // Whether the scrollbar should be visible.
	disableHoverInteractions, // Whether hover interactions should be disabled or not.
	presetQueryVariables, // The variables to be applied to grid queries (such as filters), where applicable.
	onTotalSizeChange, // What to do when the "total size" value changes
	getDetailPanelContent, // The content to display for the master detail panel, where applicable.
	deleteQuery, // Where applicable, the query for deleting an entity through the data grid.
	refetchQuery, // Where applicable, the query for re-fetching data after a grid action such as edit or delete.
	operationDataType, // Data type for operations
	editQuery, // Where applicable, the query for editing an entity through the data grid
}: {
	query: DocumentNode;
	type: string;
	selectable: boolean;
	pageSize: number;
	columns: GridColDef[];
	columnVisibilityModel?: GridColumnVisibilityModel;
	sortModel?: any;
	noResultsMessage?: string;
	noDataMessage?: string;
	noDataTitle?: string;
	searchPlaceholder?: string;
	sortDirection: string;
	sortAttribute: string;
	coreType: string;
	scrollbarVisible?: boolean;
	disableHoverInteractions?: boolean;
	presetQueryVariables?: string;
	onTotalSizeChange?: any;
	getDetailPanelContent?: any;
	deleteQuery?: DocumentNode;
	refetchQuery?: string[];
	operationDataType?: string;
	editQuery?: DocumentNode;
}) {
	const {
		sortOptions: storedSortOptions,
		filterOptions: storedFilterOptions,
		paginationModel: storedPaginationModel,
		columnVisibility: storedColumnVisibility,
		setSortOptions,
		setFilterOptions,
		setPaginationModel,
		setColumnVisibility,
	} = useGridStore();

	// The core type differs from the regular type prop, because it is the 'core data type' - i.e. if type is CircStatus, details type is RefValueMappings
	// GraphQL data comes in an array that's named after the core type, which causes problems
	// const [sortOptions, setSortOptions] = useState({ field: "", direction: "" });
	const [sortOptions, setSortOptionsState] = useState({
		field: storedSortOptions[type]?.field || sortAttribute,
		direction: storedSortOptions[type]?.direction || sortDirection,
	});
	const [filterOptions, setFilterOptionsState] = useState(
		storedFilterOptions[type]?.filterString ?? "",
	);
	const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
	const [entityToDelete, setEntityToDelete] = useState<string | null>(null);
	const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
	const [deleteAlertSeverity, setDeleteAlertSeverity] = useState<
		"success" | "error"
	>("success");
	const [deleteAlertText, setDeleteAlertText] = useState("");
	const [promiseArguments, setPromiseArguments] = useState<any>(null);
	const [editRecord, setEditRecord] = useState<any>(null);
	const [exportProgress, setExportProgress] = useState<any>({
		isExporting: false,
		progress: 0,
		totalRecords: 0,
	});
	const [alert, setAlert] = useState<any>({
		open: false,
		severity: "success",
		text: null,
	});
	const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
	const fetchQuery =
		coreType == "patronRequests" ? getPatronRequestsForExport : query;
	const [fetchAllDataQuery, { loading: allDataLoading, fetchMore }] =
		useLazyQuery(fetchQuery);
	const [getLocationForPatronRequestQuery] = useLazyQuery(getLocations);
	const { t } = useTranslation();
	const apiRef = useGridApiRef();
	const router = useRouter();
	const [paginationModel, setPaginationModelState] = useState({
		page: storedPaginationModel[type]?.page ?? 0,
		pageSize: storedPaginationModel[type]?.pageSize ?? pageSize,
	});

	const handlePaginationModelChange = (newModel: {
		page: number;
		pageSize: number;
	}) => {
		setPaginationModelState(newModel);
		setPaginationModel(type, newModel.page, newModel.pageSize);
	};

	const { data: session }: { data: any } = useSession();

	// Mutations
	const [updateRow] = useMutation(editQuery ?? updateLibraryQuery, {
		refetchQueries: refetchQuery ?? ["LoadLibraries"],
	});
	const [deleteEntity] = useMutation(deleteQuery ?? deleteLibraryQuery, {
		refetchQueries: refetchQuery ?? ["LoadLibraries"],
	});

	const isAnyRowEditing = useCallback(() => {
		return Object.values(rowModesModel).some(
			(modeItem) => modeItem.mode === GridRowModes.Edit,
		);
	}, [rowModesModel]);
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
	const handleRowModesModelChange = (newRowModesModel: GridRowModesModel) => {
		setRowModesModel(newRowModesModel);
	};

	const getExportQuery = (exportMode: string) => {
		const defaultQuery =
			presetTypes.includes(type) && filterOptions === ""
				? presetQueryVariables
				: filterOptions;
		const exportAllQuery = presetTypes.includes(type)
			? presetQueryVariables
			: "";
		switch (exportMode) {
			case "all":
				return exportAllQuery;
			case "default":
				return defaultQuery;
			case "filtered":
				return defaultQuery;
			default:
				return defaultQuery;
		}
	};

	const fetchAllData = async (exportMode: string) => {
		const currentPage = 0;
		const pageSize = 1000;
		setExportProgress({ isExporting: true, progress: 0, totalRecords: 0 });

		const { data } = await fetchAllDataQuery({
			variables: {
				pageno: currentPage,
				pagesize: pageSize,
				order: sortField,
				orderBy: direction,
				query: getExportQuery(exportMode),
			},
		});

		const totalSize = data?.[coreType].totalSize || 0;
		const totalPages = Math.ceil(totalSize / pageSize);

		// Update progress with total record count
		setExportProgress((prev: any) => ({
			...prev,
			totalRecords: totalSize,
			progress: Math.round((data?.[coreType].content.length / totalSize) * 100),
		}));

		let allContent = data?.[coreType].content || [];

		// Fetch remaining pages in sequence to avoid overwhelming the server
		for (let page = 1; page < totalPages; page++) {
			try {
				const result = await fetchMore({
					variables: {
						pageno: page,
						pagesize: pageSize,
					},
				});

				if (result.data?.[coreType]?.content) {
					allContent = [...allContent, ...result.data[coreType].content];
					// Update progress after each chunk
					setExportProgress((prev: any) => ({
						...prev,
						progress: Math.round((allContent.length / totalSize) * 100),
					}));
				}
			} catch (error) {
				console.error(`Error fetching page ${page}:`, error);
				// Continue with what we have so far rather than failing completely
				// But flag up an alert
			}
		}

		// Insert secondary location query to get the pickup location names
		if (coreType === "patronRequests") {
			// Extract unique pickup location codes
			const uniqueLocationCodes = Array.from(
				new Set(
					allContent
						.map((request: PatronRequest) => request.pickupLocationCode)
						.filter(Boolean),
				),
			);
			// If we have location codes to look up
			if (uniqueLocationCodes.length > 0) {
				// Build the query string with OR operators
				const locationQuery = uniqueLocationCodes
					.map((id) => `id:${id}`)
					.join(" OR ");

				try {
					// Single query for all locations
					const { data: locationData } = await getLocationForPatronRequestQuery(
						{
							variables: {
								query: locationQuery,
								// Include pagination variables to get all results
								pageno: 0,
								pagesize: uniqueLocationCodes.length,
								order: "name",
								orderBy: "ASC",
							},
						},
					);

					// Create mapping of location IDs to names
					const locationMap = new Map(
						locationData?.locations?.content?.map((location: Location) => [
							location.id,
							location.name,
						]) || [],
					);

					// Replace location codes with names in the content
					allContent = allContent.map((item: any) => ({
						...item,
						pickupLocationCode:
							locationMap.get(item.pickupLocationCode) ||
							item.pickupLocationCode,
						pickupLocationName:
							locationMap.get(item.pickupLocationCode) ||
							item.pickupLocationCode,
					}));
				} catch (error) {
					console.error("Error fetching location names:", error);
				}
			}
		}

		return { [coreType]: { ...data?.[coreType], content: allContent } };
	};

	const handleExport = async (fileType: string, exportMode: string) => {
		if (exportMode === "current") {
			apiRef.current.exportDataAsCsv();
			return;
		}
		if (exportMode === "print") {
			apiRef.current.exportDataAsPrint();
			return;
		}

		try {
			const allData = await fetchAllData(exportMode);
			const delimiter = fileType === "csv" ? "," : "\t";
			const fileName = `${getFileNameForExport(type, filterOptions)}.${fileType}`;
			// get visible columns, pass in - this ensures that for exports that are not "export all",
			// the export reflects the user's column selection.
			const visibleColumns = gridVisibleColumnFieldsSelector(apiRef);
			const usefulColumns =
				exportMode == "all" || exportMode == "default"
					? null
					: visibleColumns.filter(
							(value) =>
								value != "__detail_panel_toggle__" && value != "__check__",
						);
			const dataString = convertFileToString(
				allData?.[coreType]?.content,
				delimiter,
				coreType,
				usefulColumns,
			);

			// Create and download the file
			const blob = new Blob([dataString], {
				type: `text/${fileType};charset=utf-8;`,
			});
			const link = document.createElement("a");
			if (link.download !== undefined) {
				const url = URL.createObjectURL(blob);
				link.setAttribute("href", url);
				link.setAttribute("download", fileName);
				link.style.visibility = "hidden";
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				setTimeout(() => {
					setAlert({
						open: true,
						severity: "success",
						text: t("ui.data_grid.export_success", {
							count: allData?.[coreType]?.totalSize,
						}),
						title: t("ui.data_grid.success"),
					});
				}, 1000);
			}
		} catch (error) {
			console.error("Export failed:", error);
			setTimeout(() => {
				setAlert({
					open: true,
					severity: "error",
					text: t("ui.data_grid.export_failed"),
					title: t("ui.data_grid.error"),
				});
			}, 100);
		} finally {
			setExportProgress({ isExporting: false, progress: 0, totalRecords: 0 });
		}
	};

	const getDetailPanelHeight = useCallback(() => "auto", []); // Should be able to take this out when master detail is expanded to all
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
			const input = {
				id: id,
				reason: reason,
				changeCategory: changeCategory,
				changeReferenceUrl: changeReferenceUrl,
			};
			const { data } = await deleteEntity({
				variables: {
					input,
				},
			});
			const operation = "delete" + operationDataType;
			if (data?.[operation].success == true) {
				setDeleteAlertSeverity("success");
				setDeleteAlertText(
					t("ui.data_grid.delete_success", {
						entity:
							operationDataType === "ReferenceValueMapping"
								? t("mappings.ref_value_one").toLowerCase()
								: operationDataType === "NumericRangeMapping"
									? t("mappings.num_range_one").toLowerCase()
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
							operationDataType === "ReferenceValueMapping"
								? t("mappings.ref_value_one").toLowerCase()
								: operationDataType === "NumericRangeMapping"
									? t("mappings.num_range_one").toLowerCase()
									: operationDataType?.toLowerCase(),
						name: name,
					}),
				);
			}
			setDeleteAlertOpen(true);
		} catch (error) {
			const operation = "delete" + operationDataType;
			console.log(data?.[operation]);
			console.error("Error deleting entity:", error);
			setDeleteAlertSeverity("error");
			setDeleteAlertText(
				t("ui.data_grid.delete_error", {
					entity:
						operationDataType === "ReferenceValueMapping"
							? t("mappings.ref_value_one").toLowerCase()
							: operationDataType === "NumericRangeMapping"
								? t("mappings.num_range_one").toLowerCase()
								: operationDataType?.toLowerCase(),
					name: name,
				}),
			);
			setDeleteAlertOpen(true);
		}
	};
	// Is either system admin or consortium admin: therefore can edit/delete items.
	const isAnAdmin = session?.profile?.roles?.some((role: string) =>
		adminOrConsortiumAdmin.includes(role),
	);

	const handleSortModelChange = useCallback(
		(sortModel: GridSortModel) => {
			// sortDirection and sortAttributes are our defaults, passed in from each instance.
			// They are intended for use on first load, or if the sortModel value is ever null or undefined.
			const newField = sortModel[0]?.field ?? sortAttribute;
			const newDirection = sortModel[0]?.sort?.toUpperCase() ?? sortDirection;
			setSortOptionsState({
				field: newField,
				direction: newDirection,
			});
			setSortOptions(type, newField, newDirection);
		},
		[sortAttribute, sortDirection, setSortOptions, type],
	);

	const handleColumnVisibilityModelChange = (
		newModel: GridColumnVisibilityModel,
	) => {
		setColumnVisibility(type, newModel);
	};

	const onFilterChange = useCallback(
		(filterModel: GridFilterModel) => {
			const filters = filterModel?.items ?? [];
			const quickFilterValues = filterModel?.quickFilterValues ?? [];
			const logicOperator = filterModel?.logicOperator?.toUpperCase() ?? "AND";
			// Needs to disregard wildcard of the preset and stick AND NOT deleted on the end of the query
			// if on main grids: disregard preset and stick AND NOT
			// Build the filter query for all filters
			let filterQuery = filters
				.map((filter) => {
					const query = buildFilterQuery(
						filter.field ?? "id",
						filter.operator ?? "contains",
						filter.value ?? "",
					);
					return query ? query : "";
				})
				.filter(Boolean)
				.join(" " + logicOperator + " ");

			// Add quick filters if present
			if (quickFilterValues.length > 0) {
				const quickQueries = quickFilterValues.map((qv) =>
					qv.replaceAll(" ", "?"),
				);
				const quickField = quickFieldMap[type] ?? quickFieldMap.default;
				const quickFilterQuery = quickQueries
					.map((qv) => `${quickField}:*${qv}*`)
					.join(" && ");
				filterQuery = filterQuery
					? `${filterQuery} && ${quickFilterQuery}`
					: quickFilterQuery;
			}
			// Add specific logic for types that need it.
			// This is particularly useful for things like mappings, where we don't want to query deleted mappings unless explicitly stated.
			// And also for any other types of grid that have pre-set queries
			if (
				presetTypes.includes(type) &&
				type != "referenceValueMappings" &&
				type != "numericRangeMappings"
			)
				filterQuery =
					filterQuery != ""
						? `${presetQueryVariables} && ${filterQuery}`
						: `${presetQueryVariables}`; // If filter query is blank, revert to the presets.
			if (
				!isEmpty(filterModel.items) &&
				(type == "referenceValueMappings" || type == "numericRangeMappings")
			) {
				filterQuery = `(${filterQuery}) AND NOT deleted:true`;
			}
			// Set the final filter options
			setFilterOptionsState(filterQuery);
			setFilterOptions(type, filterQuery, filterModel);
		},
		[presetQueryVariables, setFilterOptions, type],
	);

	const sortField =
		sortOptions.direction !== "" ? sortOptions.field : sortAttribute;
	const direction =
		sortOptions.direction !== "" ? sortOptions.direction : sortDirection;

	const { loading, data } = useQuery(query, {
		variables: {
			// Fixes 'ghost page' issue.
			pageno: paginationModel.page,
			pagesize: paginationModel.pageSize,
			order: sortField,
			orderBy: direction,
			query:
				presetTypes.includes(type) && filterOptions == ""
					? presetQueryVariables
					: filterOptions,
		},
	});

	const totalSize = data?.[coreType]?.totalSize;
	// Some API clients return undefined while loading
	// Following lines are here to prevent `rowCountState` from being undefined during the loading
	useEffect(() => {
		if (totalSize !== undefined) {
			setRowCountState(totalSize);
			onTotalSizeChange?.(type, totalSize);
		}
	}, [totalSize, onTotalSizeChange, type]);
	// the core type prop matches to the array name coming from GraphQL
	// This isn't always the same as the "type" prop
	// i.e. different types of mappings grids
	const [rowCountState, setRowCountState] = useState(
		data?.[coreType].totalSize || 0,
	);
	useEffect(() => {
		setRowCountState((prevRowCountState: any) =>
			data?.[coreType]?.totalSize !== undefined
				? data?.[coreType]?.totalSize
				: prevRowCountState,
		);
	}, [data, setRowCountState, coreType]);

	// Listens for a row being clicked, passes through the params so they can be used to display the correct 'Details' page.
	// And formulate the correct URL
	// plurals are used for types to match URL structure.
	const handleRowClick: GridEventListener<"rowClick"> = (params, event) => {
		if (rowModesModel[params?.row?.id]?.mode !== GridRowModes.Edit) {
			// Some grids, like the PRs on the library page, need special redirection
			if (specialRedirectionTypes.includes(type)) {
				if (event.ctrlKey || event.metaKey)
					if (type === "dataChangeLog") {
						window.open(
							`/serviceInfo/dataChangeLog/${params?.row?.id}`,
							"_blank",
						);
					} else if (type === "welcomeLibraries") {
						window.open(`/libraries/${params?.row?.id}`, "_blank");
					} else if (type == "libraryLocations") {
						window.open(`/locations/${params?.row?.id}`, "_blank");
					} else if (type == "supplierRequestsLibrary") {
						window.open(`/patronRequests/${params?.row?.id}`, "_blank");
					} else {
						window.open(`/patronRequests/${params?.row?.id}`, "_blank");
					}
				if (!(event.ctrlKey || event.metaKey))
					if (type === "dataChangeLog") {
						router.push(`/serviceInfo/dataChangeLog/${params?.row?.id}`);
					} else if (type === "welcomeLibraries") {
						router.push(`/libraries/${params?.row?.id}`);
					} else if (type == "libraryLocations") {
						router.push(`/locations/${params?.row?.id}`);
					} else if (type == "supplierRequestsLibrary") {
						router.push(`/patronRequests/${params?.row?.id}`);
					} else {
						router.push(`/patronRequests/${params?.row?.id}`);
					}
			} else if (
				// Others we don't want users to be able to click through on
				!nonClickableTypes.includes(type)
			) {
				if (event.ctrlKey || event.metaKey)
					window.open(`/${type}/${params?.row?.id}`, "_blank");
				if (!(event.ctrlKey || event.metaKey))
					router.push(`/${type}/${params?.row?.id}`);
			}
		} else {
			// Don't let them navigate away if editing is present
			event.defaultMuiPrevented = true;
		}
	};

	// Finds the first editable column, in order to apply focus to it.

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
						text: t(rowValidationResult.translationKey),
						title: t("ui.data_grid.error"),
					});
					resolve(oldRow); // Validation failure: restore old row.
					return;
				}
				const mutation = computeMutation(newRow, oldRow);
				if (mutation) {
					setEditRecord(mutation);
					setPromiseArguments({ resolve, reject, newRow, oldRow });
				} else {
					resolve(oldRow); // Nothing changed so restore the old row
				}
			}),
		[apiRef, t],
	);
	const handleNo = () => {
		const { oldRow, resolve } = promiseArguments;
		resolve(oldRow); // Resolve the old row to not update the internal state
		setConfirmationModalOpen(false);
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
		Object.keys(newRow).forEach((key) => {
			if (newRow[key] !== oldRow[key]) {
				input[key] = newRow[key];
			}
		});
		// We need to get the reason, changeCategory and change category URL in here
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
					entity:
						operationDataType === "ReferenceValueMapping"
							? t("mappings.ref_value_one").toLowerCase()
							: operationDataType === "NumericRangeMapping"
								? t("mappings.num_range_one").toLowerCase()
								: operationDataType?.toLowerCase(),
					name: name ?? "",
				}),
			});
			resolve(data[updateName]);
			setPromiseArguments(null);
		} catch (error) {
			console.log(error);
			setAlert({
				open: true,
				severity: "error",
				text: t("ui.data_grid.edit_error", {
					entity:
						operationDataType === "ReferenceValueMapping"
							? t("mappings.ref_value_one").toLowerCase()
							: operationDataType === "NumericRangeMapping"
								? t("mappings.num_range_one").toLowerCase()
								: operationDataType?.toLowerCase(),
					name: name ?? "",
				}),
			});
			reject(oldRow);
			setPromiseArguments(null);
		}
	};

	const actionsColumn: GridColDef[] = [
		{
			field: "Actions",
			type: "actions",
			getActions: (params: GridRowParams) => {
				const isInEditMode =
					rowModesModel[params?.row?.id]?.mode === GridRowModes.Edit;
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
								onClick={handleSaveClick(params?.row?.id)}
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
								onClick={handleCancelClick(params?.row?.id)}
							/>
						</Tooltip>,
					];
				} else if (!isAnAdmin && !nonClickableTypes.includes(type)) {
					// If the user is not an admin AND the type of grid supports click-through to the details page.
					return [
						<GridActionsCellItem
							key={t("ui.data_grid.open")}
							showInMenu
							icon={<Visibility />}
							onClick={() => {
								router.push(
									determineDataGridPathOnClick(type, params?.row?.id),
								);
							}}
							label={t("ui.data_grid.open")}
						/>,
					];
				} else if (isAnAdmin && nonClickableTypes.includes(type)) {
					// If user is admin, but grid doesn't support click through
					return [
						<GridActionsCellItem
							icon={<Edit />}
							onClick={handleEditClick(params?.row?.id)}
							showInMenu
							label={t("ui.data_grid.edit")}
							key={t("ui.data_grid.edit")}
							disabled={isAnyRowEditing()}
						/>,
						<GridActionsCellItem
							icon={<Delete />}
							label={t("ui.data_grid.delete")}
							key={t("ui.data_grid.delete")}
							onClick={() => {
								if (isAnAdmin) {
									setConfirmationModalOpen(true);
									setEntityToDelete(params?.row?.id);
								}
							}}
							showInMenu
							disabled={isAnyRowEditing()}
						/>,
					];
				} else {
					// If the user is an admin, the grid supports click through, and the grid is one on which editing is enabled, we should show all options.
					return [
						<GridActionsCellItem
							icon={<Edit />}
							onClick={handleEditClick(params?.row?.id)}
							showInMenu
							label={t("ui.data_grid.edit")}
							key={t("ui.data_grid.edit")}
							disabled={isAnyRowEditing()}
						/>,
						<GridActionsCellItem
							icon={<Delete />}
							label={t("ui.data_grid.delete")}
							key={t("ui.data_grid.delete")}
							onClick={() => {
								if (isAnAdmin) {
									setConfirmationModalOpen(true);
									setEntityToDelete(params?.row?.id);
								}
							}}
							showInMenu
							disabled={isAnyRowEditing()}
						/>,
						<GridActionsCellItem
							key={t("ui.data_grid.open")}
							showInMenu
							icon={<Visibility />}
							disabled={isAnyRowEditing() || nonClickableTypes.includes(type)}
							onClick={() => {
								if (!nonClickableTypes.includes(type)) {
									router.push(
										determineDataGridPathOnClick(type, params?.row?.id),
									);
								}
							}}
							label={t("ui.data_grid.open")}
						/>,
					];
				}
			},
		},
	];

	// Different actions to show.
	// WHERE USER IS ADMIN AND TYPE IS CLICKABLE AND TYPE IS AN 'ACTIONS' TYPE = SHOW ALL
	// WHERE USER IS ADMIN AND TYPE IS NOT CLICKABLE AND TYPE IS AN 'ACTIONS' TYPE = SHOW EDIT AND DELETE
	// WHERE USER IS NOT ADMIN AND TYPE IS CLICKABLE AND TYPE IS AN 'ACTIONS' TYPE = SHOW OPEN#
	// WHERE USER IS NOT ADMIN AND TYPE IS NON CLICKABLE AND TYPE IS AN ACTIONS TYPE = DO NOT SHOW
	// WHERE TYPE IS NOT AN ACTIONS TYPE = DO NOT SHOW

	// If the type is not an actions type OR the type is an actions type, but a non-clickable one where the user is not an admin,
	// Then do not show the actions column.
	// The additional logic here is to stop the actions column appearing on mappings grids when the user is not an admin
	const allColumns = (
		!actionsTypes.includes(type) ||
		(!isAnAdmin &&
			nonClickableTypes.includes(type) &&
			actionsTypes.includes(type))
			? columns
			: [...columns, ...actionsColumn]
	).map((col) => ({
		...col,
		renderEditCell: (params: GridRenderEditCellParams) => (
			<CellEdit {...params} />
		),
	}));

	const gridIsExportable =
		coreType === "referenceValueMappings" ||
		type === "numericRangeMappings" ||
		coreType == "locations" ||
		coreType == "patronRequests";

	const ToolbarComponent = gridIsExportable
		? ExportToolbar
		: QuickSearchToolbar;

	return (
		<div>
			<DataGridPremium
				apiRef={apiRef}
				// Makes sure scrollbars aren't visible
				sx={{
					border: "0",
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
				}}
				columns={allColumns}
				rows={data?.[coreType]?.content ?? []}
				{...data}
				rowCount={rowCountState}
				loading={loading}
				checkboxSelection={selectable}
				disableRowSelectionOnClick
				onCellDoubleClick={(params, event) => {
					// Prevent default double-click edit behavior
					event.defaultMuiPrevented = true;
				}}
				onCellClick={(params, event) => {
					// Prevent click through if editing
					if (isAnyRowEditing()) {
						event.defaultMuiPrevented = true;
					}
				}}
				filterMode="server"
				onRowClick={handleRowClick}
				getRowId={(row) => getIdOfRow(row, type)}
				onFilterModelChange={onFilterChange}
				pageSizeOptions={[5, 10, 20, 30, 40, 50, 100, 200]}
				pagination
				paginationModel={paginationModel}
				paginationMode="server"
				processRowUpdate={processRowUpdate}
				editMode="row"
				rowModesModel={rowModesModel}
				onRowModesModelChange={handleRowModesModelChange}
				onProcessRowUpdateError={(params: GridRowParams, error: string) => {
					console.error("Error updating row:", error);
					const name = params?.row?.name ?? params?.row?.fullName;
					setAlert({
						open: true,
						severity: "error",
						text: t("ui.data_grid.edit_error", {
							entity:
								operationDataType === "ReferenceValueMapping"
									? t("mappings.ref_value_one").toLowerCase()
									: operationDataType === "NumericRangeMapping"
										? t("mappings.num_range_one").toLowerCase()
										: operationDataType?.toLowerCase(),
							name: name,
						}),
					});
				}}
				sortingMode="server"
				// sortingOrder={['asc', 'desc']} // If enabled, this will remove the 'null' sorting option
				onSortModelChange={handleSortModelChange}
				onPaginationModelChange={handlePaginationModelChange}
				onColumnVisibilityModelChange={handleColumnVisibilityModelChange}
				autoHeight={true}
				slots={{
					...staticSlots,
					noResultsOverlay: () => (
						<CustomNoResultsOverlay noResultsMessage={noResultsMessage} />
					),
					noRowsOverlay: () => (
						<CustomNoDataOverlay noDataMessage={noDataMessage} />
					),
					toolbar: ToolbarComponent,
				}}
				localeText={{
					toolbarQuickFilterPlaceholder:
						searchPlaceholder ?? t("general.search"),
					columnsManagementSearchTitle: t("ui.data_grid.find_column"),
					toolbarExportCSV: t("ui.data_grid.download_current_page"),
					toolbarExportPrint: t("ui.data_grid.print_current_page"),
					filterOperatorDoesNotEqual: t("ui.data_grid.filters.not_equal"),
					"filterOperator!=": t("ui.data_grid.filters.not_equal"),
					"filterOperator=": t("ui.data_grid.filters.equals"),
					"filterOperator>": t("ui.data_grid.filters.greater_than_exclusive"),
					"filterOperator>=": t("ui.data_grid.filters.greater_than_inclusive"),
					"filterOperator<": t("ui.data_grid.filters.less_than_exclusive"),
					"filterOperator<=": t("ui.data_grid.filters.less_than_inclusive"),
				}}
				getDetailPanelContent={getDetailPanelContent}
				getDetailPanelHeight={getDetailPanelHeight}
				// See examples here for what can be customised
				// https://github.com/mui/mui-x/blob/next/packages/grid/x-data-grid/src/constants/localeTextConstants.ts
				// https://stackoverflow.com/questions/75697255/how-to-change-mui-datagrid-toolbar-label-and-input-placeholder-text
				initialState={{
					columns: {
						columnVisibilityModel:
							storedColumnVisibility[type] || columnVisibilityModel,
					},
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
					filter: {
						filterModel: storedFilterOptions[type]?.filterModel,
					},
				}}
				slotProps={{
					toolbar: {
						showQuickFilter: true,
						handleExport,
						excelOptions: { disableToolbarButton: true },
						allDataLoading,
						type: coreType,
					},
				}}
				disableAggregation={true}
				disableRowGrouping={true}
			/>
			<Confirmation
				open={!!promiseArguments}
				onClose={handleNo}
				onConfirm={handleYes}
				type="gridEdit"
				editInformation={editRecord}
				entity={operationDataType?.toLowerCase() ?? ""}
				entityName={
					data?.[coreType].content?.name ?? data?.[coreType].content?.fullName
				}
				entityId={data?.[coreType].content?.id}
				gridEdit
			/>
			<TimedAlert
				open={alert.open}
				severityType={alert.severity}
				autoHideDuration={6000}
				alertText={alert.text}
				onCloseFunc={() => setAlert({ ...alert, open: false })}
				alertTitle={alert.title ?? t("ui.data_grid.updated")}
			/>
			{/* May need to combine these 2 */}
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
				open={deleteAlertOpen}
				severityType={deleteAlertSeverity}
				alertText={deleteAlertText}
				alertTitle={t("ui.data_grid.deleted")}
				autoHideDuration={5000}
				onCloseFunc={() => setDeleteAlertOpen(false)}
			/>
			<ExportProgressDialog
				open={exportProgress.isExporting}
				progress={exportProgress.progress}
				totalRecords={exportProgress.totalRecords}
			/>
		</div>
	);
}
