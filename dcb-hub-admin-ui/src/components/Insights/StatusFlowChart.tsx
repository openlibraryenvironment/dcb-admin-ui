import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
	Card,
	CardContent,
	Typography,
	Chip,
	Skeleton,
	Box,
} from "@mui/material";
import { LineChartPro } from "@mui/x-charts-pro";

import { useDcbRestClient } from "@hooks/useDcbRestClient";
import { useChartPalette } from "@hooks/useChartPalette";
import {
	useInsightsPlotStore,
	MAX_PLOT_SERIES,
} from "@hooks/insightsPlotStore";
import {
	timeSeriesQueryOptions,
	StatsParams,
	TimeSeriesInterval,
} from "@helpers/statsApi";

interface StatusFlowChartProps {
	params: StatsParams;
	interval: TimeSeriesInterval;
}

const CHART_HEIGHT = 360;

export default function StatusFlowChart({
	params,
	interval,
}: StatusFlowChartProps) {
	const { t } = useTranslation();
	const client = useDcbRestClient();
	const { colorForStatus } = useChartPalette();

	// Atomic selectors - never destructure the whole store.
	const selectedStatuses = useInsightsPlotStore((s) => s.selectedStatuses);
	const toggleStatus = useInsightsPlotStore((s) => s.toggleStatus);

	const { data, isLoading } = useQuery(
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
				<Typography variant="h6" gutterBottom>
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
												bgcolor: colorForStatus(status),
												color: "#fff",
												"&:hover": { bgcolor: colorForStatus(status) },
											}
										: undefined
								}
							/>
						);
					})}
				</Box>

				{isLoading ? (
					<Skeleton variant="rounded" height={CHART_HEIGHT} />
				) : xAxisData.length === 0 || series.length === 0 ? (
					<Box
						sx={{
							height: CHART_HEIGHT,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<Typography color="text.secondary">
							{t("insights.no_data")}
						</Typography>
					</Box>
				) : (
					<LineChartPro
						height={CHART_HEIGHT}
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
			</CardContent>
		</Card>
	);
}
