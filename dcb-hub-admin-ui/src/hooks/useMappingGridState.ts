import { useState, useCallback } from "react";
import {
	GridRowModesModel,
	GridPaginationModel,
	GridSortModel,
	GridFilterModel,
	GridColumnVisibilityModel,
	GridRowId,
} from "@mui/x-data-grid-premium";
import { useGridStore } from "@/hooks/useDataGridStore";

export function useMappingGridState(
	gridId: string,
	defaultVisibility: GridColumnVisibilityModel = { lastImported: false },
) {
	const {
		sortModel: storedSortModel,
		filterModel: storedFilterModel,
		paginationModel: storedPaginationModel,
		columnVisibilityModel: storedColumnVisibilityModel,
		setSortModel,
		setFilterModel,
		setPaginationModel,
		setColumnVisibilityModel,
	} = useGridStore();

	const storedState = {
		sort: storedSortModel[gridId],
		filter: storedFilterModel[gridId],
		pagination: storedPaginationModel[gridId],
		columnVisibility: storedColumnVisibilityModel[gridId],
	};

	const [paginationModel, setLocalPaginationModel] =
		useState<GridPaginationModel>(
			storedState.pagination ?? { page: 0, pageSize: 20 },
		);
	const [filterModel, setLocalFilterModel] = useState<GridFilterModel>(
		storedState.filter ?? { items: [] },
	);
	const [sortModel, setLocalSortModel] = useState<GridSortModel>(
		storedState.sort ?? [{ field: "lastImported", sort: "desc" }],
	);
	const [columnVisibilityModel, setLocalColumnVisibilityModel] =
		useState<GridColumnVisibilityModel>(
			storedState.columnVisibility ?? defaultVisibility,
		);

	const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
	const [promiseArguments, setPromiseArguments] = useState<any>(null);
	const [editRecord, setEditRecord] = useState<string | null>(null);
	const [deleteConfirmationId, setDeleteConfirmationId] =
		useState<GridRowId | null>(null);

	const [showImport, setImport] = useState(false);
	const [showNewMapping, setNewMapping] = useState(false);

	const handlePaginationChange = useCallback(
		(model: GridPaginationModel) => {
			setLocalPaginationModel(model);
			setPaginationModel(gridId, model);
		},
		[gridId, setPaginationModel],
	);

	const handleSortChange = useCallback(
		(model: GridSortModel) => {
			setLocalSortModel(model);
			setSortModel(gridId, model);
		},
		[gridId, setSortModel],
	);

	const handleFilterChange = useCallback(
		(model: GridFilterModel) => {
			setLocalFilterModel(model);
			setFilterModel(gridId, model);
		},
		[gridId, setFilterModel],
	);

	const handleColumnVisibilityChange = useCallback(
		(model: GridColumnVisibilityModel) => {
			setLocalColumnVisibilityModel(model);
			setColumnVisibilityModel(gridId, model);
		},
		[gridId, setColumnVisibilityModel],
	);

	return {
		paginationModel,
		handlePaginationChange,
		filterModel,
		handleFilterChange,
		sortModel,
		handleSortChange,
		columnVisibilityModel,
		handleColumnVisibilityChange,
		rowModesModel,
		setRowModesModel,
		promiseArguments,
		setPromiseArguments,
		editRecord,
		setEditRecord,
		deleteConfirmationId,
		setDeleteConfirmationId,
		showImport,
		setImport,
		showNewMapping,
		setNewMapping,
	};
}
