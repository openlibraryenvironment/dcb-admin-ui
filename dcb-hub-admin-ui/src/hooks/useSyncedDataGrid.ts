// hooks/useSyncedDataGrid.ts
import { useState, useCallback, useEffect } from "react";
import { useGridStore } from "@/hooks/useDataGridStore";
import { useDebounce } from "@/hooks/useDebounce";
import {
	GridPaginationModel,
	GridFilterModel,
	GridSortModel,
	GridColumnVisibilityModel,
} from "@mui/x-data-grid-premium";

interface UseSyncedDataGridProps {
	gridId: string;
	defaultSort: GridSortModel;
	defaultColumnVisibility: GridColumnVisibilityModel;
	defaultPagination: GridPaginationModel;
}

export const useSyncedDataGrid = ({
	gridId,
	defaultSort = [],
	defaultColumnVisibility = {},
	defaultPagination = { page: 0, pageSize: 25 },
}: UseSyncedDataGridProps) => {
	// global store
	const {
		sortModel: storedSort,
		filterModel: storedFilter,
		paginationModel: storedPagination,
		columnVisibilityModel: storedVisibility,
		setSortModel,
		setFilterModel,
		setPaginationModel,
		setColumnVisibilityModel,
	} = useGridStore();

	const storedState = {
		sort: storedSort[gridId],
		filter: storedFilter[gridId],
		pagination: storedPagination[gridId],
		columnVisibility: storedVisibility[gridId],
	};

	// local store
	const [paginationModel, setLocalPaginationModel] =
		useState<GridPaginationModel>(storedState.pagination ?? defaultPagination);

	const [filterModel, setLocalFilterModel] = useState<GridFilterModel>(
		storedState.filter ?? { items: [] },
	);

	const [sortModel, setLocalSortModel] = useState<GridSortModel>(
		storedState.sort ?? defaultSort,
	);

	const [columnVisibilityModel, setLocalColumnVisibilityModel] = useState(
		storedState.columnVisibility ?? defaultColumnVisibility,
	);

	// debounce filters
	const debouncedFilterModel = useDebounce(filterModel, 500);
	const [isFiltering, setIsFiltering] = useState(false);

	useEffect(() => {
		const hasActiveFilters =
			filterModel.items.some((item) => item.value) ||
			(filterModel.quickFilterValues?.length ?? 0) > 0;

		// Check if current filter differs from applied (debounced) filter
		const isDifferent =
			JSON.stringify(filterModel) !== JSON.stringify(debouncedFilterModel);
		setIsFiltering(!!hasActiveFilters && isDifferent);
	}, [filterModel, debouncedFilterModel]);

	const handlePaginationChange = useCallback(
		(model: GridPaginationModel) => {
			setLocalPaginationModel(model);
			setPaginationModel(gridId, model);
		},
		[gridId, setPaginationModel],
	);

	const handleFilterChange = useCallback(
		(model: GridFilterModel) => {
			setLocalFilterModel(model);
			setFilterModel(gridId, model);
		},
		[gridId, setFilterModel],
	);

	const handleSortChange = useCallback(
		(model: GridSortModel) => {
			setLocalSortModel(model);
			setSortModel(gridId, model);
		},
		[gridId, setSortModel],
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
		filterModel,
		sortModel,
		columnVisibilityModel,
		debouncedFilterModel,
		isFiltering,
		handlePaginationChange,
		handleFilterChange,
		handleSortChange,
		handleColumnVisibilityChange,
		setLocalFilterModel,
		setLocalSortModel,
	};
};
