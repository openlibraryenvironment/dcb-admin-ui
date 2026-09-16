import { useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";

import {
	InsightsSearch,
	MAX_PLOT_SERIES,
	RangePreset,
	resolveSearch,
} from "@helpers/insightsSearch";

/**
 * Reading and writing the Insights view through the URL.
 *
 * One hook so every control writes the same way: `replace`, so a reader dragging a date
 * range does not leave twenty entries in their history, and only the keys that differ from
 * the default, so a shared link says what was chosen rather than restating the defaults.
 */
export function useInsightsView(search: InsightsSearch, to: string) {
	const navigate = useNavigate();
	const view = resolveSearch(search);

	const update = useCallback(
		(next: Partial<InsightsSearch>) => {
			void navigate({
				to,
				search: (current: InsightsSearch) => ({ ...current, ...next }),
				replace: true,
			});
		},
		[navigate, to],
	);

	return {
		...view,
		/** A preset and an explicit window are alternatives, so choosing one clears the other. */
		setRange: (range: RangePreset) =>
			update({ range, from: undefined, to: undefined }),
		setCustomRange: (range: { startDate: string; endDate: string } | null) =>
			update(
				range
					? { from: range.startDate, to: range.endDate }
					: { from: undefined, to: undefined },
			),
		setScope: (scope: string[]) =>
			update({ scope: scope.length > 0 ? scope : undefined }),
		toggleSeries: (status: string) => {
			const selected = view.series.includes(status)
				? view.series.filter((candidate) => candidate !== status)
				: view.series.length >= MAX_PLOT_SERIES
					? view.series
					: [...view.series, status];

			update({ series: selected });
		},
		setUnitCost: (unitCost: number | null) =>
			update({ unitCost: unitCost ?? undefined }),
	};
}

/** What a component is handed: the view as stated, plus the writers that change it. */
export type InsightsView = ReturnType<typeof useInsightsView>;
