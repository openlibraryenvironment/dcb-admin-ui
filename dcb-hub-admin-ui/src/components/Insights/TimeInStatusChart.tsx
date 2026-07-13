import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, Typography, Skeleton, Box } from "@mui/material";
import { BarChartPro } from "@mui/x-charts-pro";

import { useDcbRestClient } from "@hooks/useDcbRestClient";
import { useChartPalette } from "@hooks/useChartPalette";
import { timeInStatusQueryOptions, StatsParams } from "@helpers/statsApi";
import { formatDuration } from "@helpers/insightsRange";

const CHART_HEIGHT = 340;

// Median dwell per status - the bottleneck view. Magnitude ranking -> one hue,
// horizontal for legible status labels. Plotted in hours; tooltip shows a
// human-readable duration.
export default function TimeInStatusChart({ params }: { params: StatsParams }) {
	const { t } = useTranslation();
	const client = useDcbRestClient();
	const { categorical } = useChartPalette();

	const { data, isLoading } = useQuery(
		timeInStatusQueryOptions(client, params),
	);

	const rows = data ?? [];

	return (
		<Card variant="outlined">
			<CardContent>
				<Typography variant="h6" gutterBottom>
					{t("insights.charts.time_in_status.title")}
				</Typography>
				<Typography variant="body2" color="text.secondary" gutterBottom>
					{t("insights.charts.time_in_status.subtitle")}
				</Typography>

				{isLoading ? (
					<Skeleton variant="rounded" height={CHART_HEIGHT} />
				) : rows.length === 0 ? (
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
					<BarChartPro
						height={CHART_HEIGHT}
						layout="horizontal"
						yAxis={[{ scaleType: "band", data: rows.map((r) => r.status) }]}
						xAxis={[{ label: t("insights.charts.time_in_status.axis_hours") }]}
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
			</CardContent>
		</Card>
	);
}
