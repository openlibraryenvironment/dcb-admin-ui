import { describe, it, expect, beforeEach } from "vitest";
import {
	useInsightsPlotStore,
	MAX_PLOT_SERIES,
} from "@hooks/insightsPlotStore";

describe("insightsPlotStore", () => {
	beforeEach(() => {
		useInsightsPlotStore.getState().reset();
	});

	it("toggles a status off when already selected", () => {
		const { selectedStatuses, toggleStatus } = useInsightsPlotStore.getState();
		expect(selectedStatuses).toContain("LOANED");

		toggleStatus("LOANED");
		expect(useInsightsPlotStore.getState().selectedStatuses).not.toContain(
			"LOANED",
		);
	});

	it("toggles a new status on", () => {
		useInsightsPlotStore.getState().toggleStatus("CANCELLED");
		expect(useInsightsPlotStore.getState().selectedStatuses).toContain(
			"CANCELLED",
		);
	});

	it("never exceeds the categorical series cap", () => {
		const filler = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
		// Start from empty, then attempt to add more than the cap.
		useInsightsPlotStore.setState({ selectedStatuses: [] });
		for (const s of filler) {
			useInsightsPlotStore.getState().toggleStatus(s);
		}
		const { selectedStatuses } = useInsightsPlotStore.getState();
		expect(selectedStatuses.length).toBe(MAX_PLOT_SERIES);
		expect(selectedStatuses.length).toBeLessThanOrEqual(MAX_PLOT_SERIES);
	});
});
