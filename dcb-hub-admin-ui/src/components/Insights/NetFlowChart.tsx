import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Box, Card, CardContent, Typography } from "@mui/material";
import { BarChartPro } from "@mui/x-charts-pro";

import { useDcbRestClient } from "@hooks/useDcbRestClient";
import { useChartPalette } from "@hooks/useChartPalette";
import { netFlowQueryOptions, StatsParams } from "@helpers/statsApi";

import PanelState from "./PanelState";

import MetricInfo from "./MetricInfo";

const CHART_HEIGHT = 320;

export default function NetFlowChart({ params }: { params: StatsParams }) {
	const { t } = useTranslation();
	const client = useDcbRestClient();
	const { categorical } = useChartPalette();

	const { data, isLoading, isError, error, refetch, isFetching } = useQuery(
		netFlowQueryOptions(client, params),
	);

	// Busiest libraries first; cap so the axis stays legible.
	const rows = (data ?? [])
		.slice()
		.sort(
			(a, b) =>
				b.borrowedCount + b.suppliedCount - (a.borrowedCount + a.suppliedCount),
		)
		.slice(0, 15);

	return (
		<Card variant="outlined">
			<CardContent>
				<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
					<Typography variant="h6" component="h3">
						{t("insights.charts.net_flow.title")}
					</Typography>
					<MetricInfo
						metric="net_flow"
						label={t("insights.charts.net_flow.title")}
					/>
				</Box>
				<Typography variant="body2" color="text.secondary" gutterBottom>
					{t("insights.charts.net_flow.subtitle")}
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
							xAxis={[
								{ scaleType: "band", data: rows.map((r) => r.libraryCode) },
							]}
							series={[
								{
									data: rows.map((r) => r.borrowedCount),
									label: t("insights.charts.net_flow.borrowed"),
									color: categorical[0],
								},
								{
									data: rows.map((r) => r.suppliedCount),
									label: t("insights.charts.net_flow.supplied"),
									color: categorical[1],
								},
							]}
						/>
					)}
				</PanelState>
			</CardContent>
		</Card>
	);
}
