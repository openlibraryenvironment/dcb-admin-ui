import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Box, Card, CardContent, Typography } from "@mui/material";
import { BarChartPro } from "@mui/x-charts-pro";

import { useDcbRestClient } from "@hooks/useDcbRestClient";
import { useChartPalette } from "@hooks/useChartPalette";

import PanelState from "./PanelState";

import MetricInfo from "./MetricInfo";
import {
	supplierReliabilityQueryOptions,
	StatsParams,
} from "@helpers/statsApi";

const CHART_HEIGHT = 320;

export default function SupplierReliabilityChart({
	params,
}: {
	params: StatsParams;
}) {
	const { t } = useTranslation();
	const client = useDcbRestClient();
	const { status } = useChartPalette();

	const { data, isLoading, isError, error, refetch, isFetching } = useQuery(
		supplierReliabilityQueryOptions(client, params),
	);

	// Show the least-reliable suppliers first (most failures) - that is the actionable end.
	const rows = (data ?? [])
		.slice()
		.sort((a, b) => b.failedCount - a.failedCount)
		.slice(0, 15);

	return (
		<Card variant="outlined">
			<CardContent>
				<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
					<Typography variant="h6" component="h3">
						{t("insights.charts.supplier_reliability.title")}
					</Typography>
					<MetricInfo
						metric="supplier_reliability"
						label={t("insights.charts.supplier_reliability.title")}
					/>
				</Box>
				<Typography variant="body2" color="text.secondary" gutterBottom>
					{t("insights.charts.supplier_reliability.subtitle")}
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
						// Status encoding (good/critical) - labelled via the legend, never colour alone.
						<BarChartPro
							height={CHART_HEIGHT}
							xAxis={[
								{ scaleType: "band", data: rows.map((r) => r.supplierCode) },
							]}
							series={[
								{
									data: rows.map((r) => r.fulfilledCount),
									label: t("insights.charts.supplier_reliability.fulfilled"),
									color: status.good,
									stack: "total",
								},
								{
									data: rows.map((r) => r.failedCount),
									label: t("insights.charts.supplier_reliability.failed"),
									color: status.critical,
									stack: "total",
								},
							]}
						/>
					)}
				</PanelState>
			</CardContent>
		</Card>
	);
}
