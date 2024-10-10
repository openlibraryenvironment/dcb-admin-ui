import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type GridState = {
	sortOptions: Record<string, { field: string; direction: string }>;
	filterOptions: Record<string, string>;
	paginationModel: Record<string, { page: number; pageSize: number }>;
	columnVisibility: Record<string, Record<string, boolean>>;
};

type GridActions = {
	setSortOptions: (gridType: string, field: string, direction: string) => void;
	setFilterOptions: (gridType: string, filterString: string) => void;
	setPaginationModel: (
		gridType: string,
		page: number,
		pageSize: number,
	) => void;
	setColumnVisibility: (
		gridType: string,
		model: Record<string, boolean>,
	) => void;
	clearGridState: () => void;
};

export const useGridStore = create<GridState & GridActions>()(
	persist(
		(set) => ({
			sortOptions: {},
			filterOptions: {},
			paginationModel: {},
			columnVisibility: {},

			setSortOptions: (gridType, field, direction) =>
				set((state) => ({
					sortOptions: {
						...state.sortOptions,
						[gridType]: { field, direction },
					},
				})),

			setFilterOptions: (gridType, filterString) =>
				set((state) => ({
					filterOptions: {
						...state.filterOptions,
						[gridType]: filterString,
					},
				})),

			setPaginationModel: (gridType, page, pageSize) =>
				set((state) => ({
					paginationModel: {
						...state.paginationModel,
						[gridType]: { page, pageSize },
					},
				})),

			setColumnVisibility: (gridType, model) =>
				set((state) => ({
					columnVisibility: {
						...state.columnVisibility,
						[gridType]: model,
					},
				})),

			clearGridState: () =>
				set(() => ({
					sortOptions: {},
					filterOptions: {},
					paginationModel: {},
					columnVisibility: {},
				})),
			clearAllGridStates: () =>
				set(() => ({
					sortOptions: {},
					filterOptions: {},
					paginationModel: {},
					columnVisibility: {},
				})),
		}),
		{
			name: "grid-storage",
			storage: createJSONStorage(() => sessionStorage),
		},
	),
);
