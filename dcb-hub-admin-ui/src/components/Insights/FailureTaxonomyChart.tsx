import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, Typography, Skeleton, Box } from "@mui/material";
import { BarChartPro } from "@mui/x-charts-pro";

import { useDcbRestClient } from "@hooks/useDcbRestClient";
import { useChartPalette } from "@hooks/useChartPalette";
import { failureTaxonomyQueryOptions, StatsParams } from "@helpers/statsApi";

const CHART_HEIGHT = 320;

export default function FailureTaxonomyChart({
	params,
}: {
	params: StatsParams;
}) {
	const { t } = useTranslation();
	const client = useDcbRestClient();
	const { categorical } = useChartPalette();

	const { data, isLoading } = useQuery(
		failureTaxonomyQueryOptions(client, params),
	);

	const rows = data ?? [];

	return (
		<Card variant="outlined">
			<CardContent>
				<Typography variant="h6" gutterBottom>
					{t("insights.charts.failure_taxonomy.title")}
				</Typography>
				<Typography variant="body2" color="text.secondary" gutterBottom>
					{t("insights.charts.failure_taxonomy.subtitle")}
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
			</CardContent>
		</Card>
	);
}
