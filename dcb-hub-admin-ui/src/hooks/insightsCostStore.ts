import { create } from "zustand";
import { persist } from "zustand/middleware";

// The "traditional ILL" unit cost is deliberately NOT shipped with a default value -
// stating a cost the consortium did not choose would poison the credibility of the
// whole value story. It is entered by the user and remembered locally. Cost
// avoidance is then computed client-side as successfulCount * illUnitCost.

type InsightsCostState = {
	illUnitCost: number | null;
	currencySymbol: string;
	setIllUnitCost: (cost: number | null) => void;
	setCurrencySymbol: (symbol: string) => void;
};

export const useInsightsCostStore = create<InsightsCostState>()(
	persist(
		(set) => ({
			illUnitCost: null,
			currencySymbol: "£",
			setIllUnitCost: (illUnitCost) => set({ illUnitCost }),
			setCurrencySymbol: (currencySymbol) => set({ currencySymbol }),
		}),
		{ name: "dcb-insights-ill-cost" },
	),
);
