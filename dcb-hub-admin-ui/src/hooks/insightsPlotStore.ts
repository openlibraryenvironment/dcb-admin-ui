import { create } from "zustand";

// Transient client UI state ONLY (which status series the user has chosen to plot,
// and the active time-range preset). Server data lives in TanStack Query. Consume
// with atomic selectors, e.g. useInsightsPlotStore((s) => s.selectedStatuses).

export type RangePreset = "7d" | "30d" | "90d" | "365d";

// Default plot: the statuses that tell the "is it working" story over time.
const DEFAULT_STATUSES = [
	"LOANED",
	"REQUEST_PLACED_AT_SUPPLYING_AGENCY",
	"ERROR",
];

// Skill rule: beyond 8 categorical series, fold into Other / small multiples rather
// than invent hues. We cap the plot-builder at 8 concurrent series.
export const MAX_PLOT_SERIES = 8;

export type CustomRange = { startDate: string; endDate: string };

type InsightsPlotState = {
	selectedStatuses: string[];
	rangePreset: RangePreset;
	// When set, an explicit date window overrides the preset. Choosing a preset clears it.
	customRange: CustomRange | null;
	toggleStatus: (status: string) => void;
	setRangePreset: (preset: RangePreset) => void;
	setCustomRange: (range: CustomRange | null) => void;
	reset: () => void;
};

export const useInsightsPlotStore = create<InsightsPlotState>((set) => ({
	selectedStatuses: DEFAULT_STATUSES,
	rangePreset: "30d",
	customRange: null,
	toggleStatus: (status) =>
		set((state) => {
			if (state.selectedStatuses.includes(status)) {
				return {
					selectedStatuses: state.selectedStatuses.filter((s) => s !== status),
				};
			}
			if (state.selectedStatuses.length >= MAX_PLOT_SERIES) {
				return state; // at cap - ignore
			}
			return { selectedStatuses: [...state.selectedStatuses, status] };
		}),
	setRangePreset: (rangePreset) => set({ rangePreset, customRange: null }),
	setCustomRange: (customRange) => set({ customRange }),
	reset: () =>
		set({
			selectedStatuses: DEFAULT_STATUSES,
			rangePreset: "30d",
			customRange: null,
		}),
}));
