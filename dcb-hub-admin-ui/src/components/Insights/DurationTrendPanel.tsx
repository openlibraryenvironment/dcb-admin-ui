import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
	Box,
	Card,
	CardContent,
	ToggleButton,
	ToggleButtonGroup,
	Typography,
} from "@mui/material";
import { LineChartPro } from "@mui/x-charts-pro";

import { useDcbRestClient } from "@hooks/useDcbRestClient";
import { useChartPalette } from "@hooks/useChartPalette";
import MetricInfo from "./MetricInfo";
import PanelState from "./PanelState";
import { formatDuration } from "@helpers/insightsRange";
import type { MetricId } from "@helpers/insightsMetrics";
import {
	trendQueryOptions,
	StatsParams,
	TimeSeriesInterval,
	TrendMetric,
} from "@helpers/statsApi";

/**
 * Is the wait getting longer?
 *
 * The three durations an operations manager actually asks about, over time. Every
 * percentile elsewhere in the feature is a single aggregate over one window; these come
 * from `/insights/trend`, which buckets them, so one line is one request rather than one
 * request per bucket.
 */

const CHART_HEIGHT = 320;

/** The three durations, and what each needs from the endpoint's vocabulary. */
const DURATIONS = [
	{
		id: "turnaround",
		metric: "TURNAROUND_TO_STATUS" as TrendMetric,
		extra: { targetStatus: "LOANED" },
		method: "turnaround_trend" as MetricId,
	},
	{
		id: "supplier_response",
		metric: "SUPPLIER_RESPONSE" as TrendMetric,
		extra: undefined,
		method: "supplier_response_trend" as MetricId,
	},
	{
		id: "transit",
		metric: "STATUS_DWELL" as TrendMetric,
		extra: { status: "PICKUP_TRANSIT" },
		method: "transit_dwell_trend" as MetricId,
	},
] as const;

export default function DurationTrendPanel({
	params,
	interval,
}: {
	params: StatsParams;
	interval: TimeSeriesInterval;
}) {
	const { t } = useTranslation();
	const client = useDcbRestClient();
	const { categorical } = useChartPalette();

	// Which duration is plotted is a reading choice within one panel, not a view the
	// reader would share - the subject and the window in the URL already carry that.
	const [selected, setSelected] =
		useState<(typeof DURATIONS)[number]["id"]>("turnaround");
	const duration = DURATIONS.find((entry) => entry.id === selected)!;

	const { data, isLoading, isError, error, refetch, isFetching } = useQuery(
		trendQueryOptions(
			client,
			params,
			interval,
			duration.metric,
			duration.extra,
		),
	);

	// A bucket with no observations is absent from the response, so the axis is what came
	// back rather than the window: plotting a gap as zero would draw an instant journey.
	const { buckets, p50, p95 } = useMemo(() => {
		const points = [...(data ?? [])].sort((a, b) =>
			a.bucket.localeCompare(b.bucket),
		);

		return {
			buckets: points.map((point) => new Date(point.bucket)),
			p50: points.map((point) => point.p50Seconds),
			p95: points.map((point) => point.p95Seconds),
		};
	}, [data]);

	const title = t("insights.trends.durations.title");

	return (
		<Card variant="outlined">
			<CardContent>
				<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
					<Typography variant="h6" component="h3">
						{title}
					</Typography>
					<MetricInfo
						metric={duration.method}
						label={t(`insights.trends.durations.${duration.id}`)}
						sampleCount={(data ?? []).reduce(
							(total, point) => total + (point.sampleCount ?? 0),
							0,
						)}
					/>
				</Box>
				<Typography variant="body2" color="text.secondary" gutterBottom>
					{t("insights.trends.durations.subtitle")}
				</Typography>

				<ToggleButtonGroup
					size="small"
					exclusive
					value={selected}
					onChange={(_event, value) => value && setSelected(value)}
					aria-label={t("insights.trends.durations.metric_label")}
					sx={{ mb: 2 }}
				>
					{DURATIONS.map((entry) => (
						<ToggleButton key={entry.id} value={entry.id}>
							{t(`insights.trends.durations.${entry.id}`)}
						</ToggleButton>
					))}
				</ToggleButtonGroup>

				<PanelState
					isLoading={isLoading}
					isError={isError}
					error={error}
					isEmpty={buckets.length === 0}
					onRetry={refetch}
					isRetrying={isFetching}
					height={CHART_HEIGHT}
				>
					{() => (
						<LineChartPro
							height={CHART_HEIGHT}
							xAxis={[{ data: buckets, scaleType: "time" }]}
							yAxis={[
								{ valueFormatter: (value: number) => formatDuration(value) },
							]}
							series={[
								{
									data: p50,
									label: t("insights.trends.durations.p50"),
									color: categorical[0],
									// connectNulls is deliberately OFF: a missing bucket is a
									// period with no observations, and joining across it would
									// draw a measurement nobody took.
									valueFormatter: (value: number | null) =>
										formatDuration(value),
									showMark: true,
								},
								{
									data: p95,
									label: t("insights.trends.durations.p95"),
									color: categorical[1],
									valueFormatter: (value: number | null) =>
										formatDuration(value),
									showMark: true,
								},
							]}
						/>
					)}
				</PanelState>
			</CardContent>
		</Card>
	);
}
