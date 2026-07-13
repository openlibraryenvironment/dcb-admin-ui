import {
	GridFilterModel,
	GridPaginationModel,
	GridSortModel,
	GridColumnVisibilityModel,
} from "@mui/x-data-grid-premium";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Persist all our grid options so we don't lose them on reload
// Remember these need to be by library in some cases
interface GridState {
	// Sort model is stored directly for consistency
	sortModel: Record<string, GridSortModel>;
	// Only the filter model is needed; the string is derived from it
	filterModel: Record<string, GridFilterModel>;
	paginationModel: Record<string, GridPaginationModel>;
	columnVisibilityModel: Record<string, GridColumnVisibilityModel>;
}

interface GridActions {
	setSortModel: (gridType: string, model: GridSortModel) => void;
	setFilterModel: (gridType: string, model: GridFilterModel) => void;
	setPaginationModel: (gridType: string, model: GridPaginationModel) => void;
	setColumnVisibilityModel: (
		gridType: string,
		model: GridColumnVisibilityModel,
	) => void;
	clearGridState: () => void;
}

export const useGridStore = create<GridState & GridActions>()(
	persist(
		(set) => ({
			sortModel: {},
			filterModel: {},
			paginationModel: {},
			columnVisibilityModel: {},

			setSortModel: (gridType, model) =>
				set((state) => ({
					sortModel: { ...state.sortModel, [gridType]: model },
				})),

			setFilterModel: (gridType, model) =>
				set((state) => ({
					filterModel: { ...state.filterModel, [gridType]: model },
				})),

			setPaginationModel: (gridType, model) =>
				set((state) => ({
					paginationModel: { ...state.paginationModel, [gridType]: model },
				})),

			setColumnVisibilityModel: (gridType, model) =>
				set((state) => ({
					columnVisibilityModel: {
						...state.columnVisibilityModel,
						[gridType]: model,
					},
				})),

			clearGridState: () =>
				set(() => ({
					sortModel: {},
					filterModel: {},
					paginationModel: {},
					columnVisibilityModel: {},
				})),
		}),
		{
			name: "grid-storage",
			storage: createJSONStorage(() => sessionStorage), // or localStorage - make sure to append by library!
		},
	),
);
