import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, Typography, Chip, Box } from "@mui/material";
import { ChartsToolbarPro, LineChartPro } from "@mui/x-charts-pro";

import { useDcbRestClient } from "@hooks/useDcbRestClient";
import { useChartPalette, inkOn } from "@hooks/useChartPalette";

import PanelState from "./PanelState";
import { MAX_PLOT_SERIES } from "@helpers/insightsSearch";
import type { InsightsView } from "@hooks/useInsightsView";
import {
	timeSeriesQueryOptions,
	StatsParams,
	TimeSeriesInterval,
} from "@helpers/statsApi";

interface StatusFlowChartProps {
	params: StatsParams;
	interval: TimeSeriesInterval;
	/** Which series are plotted is part of the view, so it travels in the URL. */
	view: InsightsView;
}

const CHART_HEIGHT = 360;

export default function StatusFlowChart({
	params,
	interval,
	view,
}: StatusFlowChartProps) {
	const { t } = useTranslation();
	const client = useDcbRestClient();
	const { colorForStatus } = useChartPalette();

	// Atomic selectors - never destructure the whole store.
	const selectedStatuses = view.series;
	const toggleStatus = view.toggleSeries;

	const { data, isLoading, isError, error, refetch, isFetching } = useQuery(
		timeSeriesQueryOptions(client, params, interval),
	);

	// Distinct statuses actually present in the window drive the plot-builder chips.
	const availableStatuses = useMemo(() => {
		const set = new Set<string>((data ?? []).map((p) => p.series));
		return Array.from(set).sort();
	}, [data]);

	// Pivot [{bucket, series, count}] into aligned per-series arrays over a shared,
	// sorted bucket axis (missing = 0).
	const { xAxisData, series } = useMemo(() => {
		const points = data ?? [];
		const buckets = Array.from(new Set(points.map((p) => p.bucket))).sort();
		const bucketIndex = new Map(buckets.map((b, i) => [b, i]));

		const byStatus = new Map<string, number[]>();
		for (const status of selectedStatuses) {
			byStatus.set(status, new Array(buckets.length).fill(0));
		}
		for (const p of points) {
			const arr = byStatus.get(p.series);
			if (arr) arr[bucketIndex.get(p.bucket)!] = p.count;
		}

		return {
			xAxisData: buckets.map((b) => new Date(b)),
			series: selectedStatuses.map((status) => ({
				id: status,
				label: status,
				data: byStatus.get(status) ?? [],
				color: colorForStatus(status),
				showMark: false,
				curve: "monotoneX" as const,
			})),
		};
	}, [data, selectedStatuses, colorForStatus]);

	const atCap = selectedStatuses.length >= MAX_PLOT_SERIES;
	const pickerLabel: string = t("insights.charts.status_flow.picker_label");

	return (
		<Card variant="outlined">
			<CardContent>
				<Typography variant="h6" component="h3" gutterBottom>
					{t("insights.charts.status_flow.title")}
				</Typography>
				<Typography variant="body2" color="text.secondary" gutterBottom>
					{t("insights.charts.status_flow.subtitle")}
				</Typography>

				{/* Plot-builder: pick the status series to overlay. */}
				<Box
					role="group"
					aria-label={pickerLabel}
					sx={{ display: "flex", flexWrap: "wrap", gap: 1, my: 2 }}
				>
					{availableStatuses.map((status) => {
						const selected = selectedStatuses.includes(status);
						const chipColor = colorForStatus(status);
						return (
							<Chip
								key={status}
								label={status}
								variant={selected ? "filled" : "outlined"}
								onClick={() => toggleStatus(status)}
								aria-pressed={selected}
								disabled={!selected && atCap}
								sx={
									selected
										? {
												bgcolor: chipColor,
												color: inkOn(chipColor),
												"&:hover": { bgcolor: chipColor },
											}
										: undefined
								}
							/>
						);
					})}
				</Box>

				<PanelState
					isLoading={isLoading}
					isError={isError}
					error={error}
					isEmpty={xAxisData.length === 0 || series.length === 0}
					onRetry={refetch}
					isRetrying={isFetching}
					height={CHART_HEIGHT}
				>
					{() => (
						<LineChartPro
							height={CHART_HEIGHT}
							// The image and print export the MUI X Premium licence already covers,
							// which nothing in this application used. A picture for a slide is a
							// different need from the numbers, and this is where a reader looks for it.
							showToolbar
							slots={{ toolbar: ChartsToolbarPro }}
							xAxis={[
								{
									data: xAxisData,
									scaleType: "time",
									zoom: true,
								},
							]}
							series={series}
						/>
					)}
				</PanelState>
			</CardContent>
		</Card>
	);
}
