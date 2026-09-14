import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Box, Card, CardContent, Typography } from "@mui/material";
import { BarChartPro } from "@mui/x-charts-pro";

import { useDcbRestClient } from "@hooks/useDcbRestClient";
import { useChartPalette } from "@hooks/useChartPalette";
import { timeInStatusQueryOptions, StatsParams } from "@helpers/statsApi";
import { formatDuration } from "@helpers/insightsRange";

import PanelState from "./PanelState";

import MetricInfo from "./MetricInfo";

const CHART_HEIGHT = 340;

// Median dwell per status - the bottleneck view. Magnitude ranking -> one hue,
// horizontal for legible status labels. Plotted in hours; tooltip shows a
// human-readable duration.
export default function TimeInStatusChart({ params }: { params: StatsParams }) {
	const { t } = useTranslation();
	const client = useDcbRestClient();
	const { categorical } = useChartPalette();

	const { data, isLoading, isError, error, refetch, isFetching } = useQuery(
		timeInStatusQueryOptions(client, params),
	);

	const rows = data ?? [];

	return (
		<Card variant="outlined">
			<CardContent>
				<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
					<Typography variant="h6" component="h3">
						{t("insights.charts.time_in_status.title")}
					</Typography>
					<MetricInfo
						metric="transit_dwell"
						label={t("insights.charts.time_in_status.title")}
					/>
				</Box>
				<Typography variant="body2" color="text.secondary" gutterBottom>
					{t("insights.charts.time_in_status.subtitle")}
				</Typography>

				<PanelState
					isLoading={isLoading}
					isError={isError}
					error={error}
					isEmpty={rows.length === 0}
					onRetry={refetch}
					isRetrying={isFetching}
					height={CHART_HEIGHT}
				>
					{() => (
						<BarChartPro
							height={CHART_HEIGHT}
							layout="horizontal"
							yAxis={[{ scaleType: "band", data: rows.map((r) => r.status) }]}
							xAxis={[
								{ label: t("insights.charts.time_in_status.axis_hours") },
							]}
							series={[
								{
									data: rows.map((r) => r.medianDwellSeconds / 3600),
									label: t("insights.charts.time_in_status.series"),
									color: categorical[0],
									valueFormatter: (v) =>
										v == null ? "—" : formatDuration(v * 3600),
								},
							]}
							margin={{ left: 180 }}
						/>
					)}
				</PanelState>
			</CardContent>
		</Card>
	);
}
