import { create } from "zustand";
import { SearchFilter } from "@models/SearchTypes";
import { GridPaginationModel } from "@mui/x-data-grid-premium";

// The filters for shared index search are a little different ...
interface FilterState {
	appliedFilters: SearchFilter[];
	setAppliedFilters: (filters: SearchFilter[]) => void;
	paginationModel: GridPaginationModel;
	setPaginationModel: (model: GridPaginationModel) => void;
}

export const useSearchGridStore = create<FilterState>((set) => ({
	appliedFilters: [],
	setAppliedFilters: (filters) => set({ appliedFilters: filters }),
	paginationModel: { page: 0, pageSize: 25 }, // Default initial state
	setPaginationModel: (model) => set({ paginationModel: model }),
}));
