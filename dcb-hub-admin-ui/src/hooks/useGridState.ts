import { useCallback, useState } from "react";
import {
	GridPaginationModel,
	GridSortModel,
	GridFilterModel,
	GridColumnVisibilityModel,
	GridRowModesModel,
} from "@mui/x-data-grid-premium";
import { useGridStore } from "@/hooks/useDataGridStore";

export interface GridStateDefaults {
	pagination?: GridPaginationModel;
	sort?: GridSortModel;
	filter?: GridFilterModel;
	columnVisibility?: GridColumnVisibilityModel;
}

const DEFAULT_PAGINATION: GridPaginationModel = { page: 0, pageSize: 25 };
const EMPTY_FILTER: GridFilterModel = { items: [] };
const EMPTY_SORT: GridSortModel = [];
const EMPTY_VISIBILITY: GridColumnVisibilityModel = {};

/**
 * Single source of truth for a server-driven grid's transient UI state
 * (pagination / sort / filter / column visibility / row edit modes).
 *
 * Replaces the per-route boilerplate of mirroring every model in local
 * `useState` AND in the Zustand persistence store, plus three near-identical
 * change handlers. It:
 *  - seeds local state once from the persisted store (via `getState()`, so the
 *    grid does not re-render when unrelated grids mutate the store);
 *  - subscribes to the store setters with ATOMIC selectors, avoiding the
 *    whole-store destructure that triggers a global re-render cascade;
 *  - persists every change back to the store transparently.
 *
 * The returned change handlers are stable (`useCallback`) so they never make
 * the grid's memoised children re-render.
 */
export function useGridState(gridId: string, defaults: GridStateDefaults = {}) {
	const setStorePagination = useGridStore((s) => s.setPaginationModel);
	const setStoreSort = useGridStore((s) => s.setSortModel);
	const setStoreFilter = useGridStore((s) => s.setFilterModel);
	const setStoreColumnVisibility = useGridStore(
		(s) => s.setColumnVisibilityModel,
	);

	const [paginationModel, setPaginationModel] = useState<GridPaginationModel>(
		() =>
			useGridStore.getState().paginationModel[gridId] ??
			defaults.pagination ??
			DEFAULT_PAGINATION,
	);
	const [sortModel, setSortModel] = useState<GridSortModel>(
		() =>
			useGridStore.getState().sortModel[gridId] ?? defaults.sort ?? EMPTY_SORT,
	);
	const [filterModel, setFilterModel] = useState<GridFilterModel>(
		() =>
			useGridStore.getState().filterModel[gridId] ??
			defaults.filter ??
			EMPTY_FILTER,
	);
	const [columnVisibilityModel, setColumnVisibilityModel] =
		useState<GridColumnVisibilityModel>(
			() =>
				useGridStore.getState().columnVisibilityModel[gridId] ??
				defaults.columnVisibility ??
				EMPTY_VISIBILITY,
		);
	const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

	const onPaginationModelChange = useCallback(
		(model: GridPaginationModel) => {
			setPaginationModel(model);
			setStorePagination(gridId, model);
		},
		[gridId, setStorePagination],
	);

	const onSortModelChange = useCallback(
		(model: GridSortModel) => {
			setSortModel(model);
			setStoreSort(gridId, model);
		},
		[gridId, setStoreSort],
	);

	const onFilterModelChange = useCallback(
		(model: GridFilterModel) => {
			setFilterModel(model);
			setStoreFilter(gridId, model);
		},
		[gridId, setStoreFilter],
	);

	const onColumnVisibilityModelChange = useCallback(
		(model: GridColumnVisibilityModel) => {
			setColumnVisibilityModel(model);
			setStoreColumnVisibility(gridId, model);
		},
		[gridId, setStoreColumnVisibility],
	);

	return {
		paginationModel,
		sortModel,
		filterModel,
		columnVisibilityModel,
		rowModesModel,
		setRowModesModel,
		onPaginationModelChange,
		onSortModelChange,
		onFilterModelChange,
		onColumnVisibilityModelChange,
	};
}
