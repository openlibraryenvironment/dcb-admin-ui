import { useEffect, useRef } from "react";
import { GridFilterModel, GridSortModel } from "@mui/x-data-grid-premium";
import { useGridStore } from "@/hooks/useDataGridStore";

// An experimental way of making it so that the errors in filtering / sorting do not cascade and cause the whole page to error
// We could do with this for the requesting search too
export const useDataGridErrorSafely = (
	gridId: string,
	isError: boolean,
	error: unknown,
	setLocalFilterModel: (model: GridFilterModel) => void,
	setLocalSortModel: (model: GridSortModel) => void,
	onReset?: () => void,
) => {
	const {
		setFilterModel,
		setSortModel,
		filterModel: globalFilterModel,
		sortModel: globalSortModel,
	} = useGridStore();

	const errorRef = useRef<unknown>(null);

	useEffect(() => {
		if (!isError) {
			errorRef.current = null;
			return;
		}

		if (error === errorRef.current) return;

		// Check the filters and sorts
		const currentFilterModel = globalFilterModel[gridId];
		const hasItems =
			currentFilterModel?.items && currentFilterModel.items.length > 0;
		const hasQuickFilter =
			currentFilterModel?.quickFilterValues &&
			currentFilterModel.quickFilterValues.length > 0;

		const currentSortModel = globalSortModel[gridId];
		const hasSort = currentSortModel && currentSortModel.length > 0;

		// If everything is the same, don't reset, as a generic error has probably occurred.
		if (!hasItems && !hasQuickFilter && !hasSort) {
			return;
		}

		console.warn(
			`[DataGridSafetyHook] Query failed for grid '${gridId}'. Resetting filters and sort.`,
			error,
		);

		// For now, full reset. Would be good to reset to last safe point

		const emptyFilterModel: GridFilterModel = {
			items: [],
			quickFilterValues: [],
		};
		const emptySortModel: GridSortModel = [];

		setLocalFilterModel(emptyFilterModel);
		setLocalSortModel(emptySortModel);

		setFilterModel(gridId, emptyFilterModel);
		setSortModel(gridId, emptySortModel);

		if (onReset) {
			onReset();
		}

		errorRef.current = error;
	}, [
		isError,
		error,
		gridId,
		setFilterModel,
		setSortModel,
		globalFilterModel,
		globalSortModel,
		setLocalFilterModel,
		setLocalSortModel,
		onReset,
	]);
};
