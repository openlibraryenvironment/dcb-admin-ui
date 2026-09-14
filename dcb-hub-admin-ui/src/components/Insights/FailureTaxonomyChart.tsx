import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Box, Card, CardContent, Typography } from "@mui/material";
import { BarChartPro } from "@mui/x-charts-pro";

import { useDcbRestClient } from "@hooks/useDcbRestClient";
import { useChartPalette } from "@hooks/useChartPalette";
import { failureTaxonomyQueryOptions, StatsParams } from "@helpers/statsApi";

import PanelState from "./PanelState";

import MetricInfo from "./MetricInfo";

const CHART_HEIGHT = 320;

export default function FailureTaxonomyChart({
	params,
}: {
	params: StatsParams;
}) {
	const { t } = useTranslation();
	const client = useDcbRestClient();
	const { categorical } = useChartPalette();

	const { data, isLoading, isError, error, refetch, isFetching } = useQuery(
		failureTaxonomyQueryOptions(client, params),
	);

	const rows = data ?? [];

	return (
		<Card variant="outlined">
			<CardContent>
				<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
					<Typography variant="h6" component="h3">
						{t("insights.charts.failure_taxonomy.title")}
					</Typography>
					<MetricInfo
						metric="failure_taxonomy"
						label={t("insights.charts.failure_taxonomy.title")}
					/>
				</Box>
				<Typography variant="body2" color="text.secondary" gutterBottom>
					{t("insights.charts.failure_taxonomy.subtitle")}
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
						// Magnitude ranking -> one hue, horizontal for legible reason labels.
						<BarChartPro
							height={CHART_HEIGHT}
							layout="horizontal"
							yAxis={[{ scaleType: "band", data: rows.map((r) => r.reason) }]}
							series={[
								{
									data: rows.map((r) => r.count),
									label: t("insights.charts.failure_taxonomy.series"),
									color: categorical[0],
								},
							]}
							margin={{ left: 160 }}
						/>
					)}
				</PanelState>
			</CardContent>
		</Card>
	);
}
