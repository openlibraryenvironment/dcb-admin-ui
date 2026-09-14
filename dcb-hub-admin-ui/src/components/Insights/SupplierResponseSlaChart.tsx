import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Box, Card, CardContent, Typography } from "@mui/material";
import { BarChartPro } from "@mui/x-charts-pro";

import { useDcbRestClient } from "@hooks/useDcbRestClient";
import { useChartPalette } from "@hooks/useChartPalette";
import {
	supplierResponseSlaQueryOptions,
	StatsParams,
} from "@helpers/statsApi";
import { formatDuration } from "@helpers/insightsRange";

import PanelState from "./PanelState";

import MetricInfo from "./MetricInfo";

const CHART_HEIGHT = 340;

// Median time from request-placed to supplier-confirmed, per supplier - the
// lender-side responsiveness SLA. Slowest responders first.
export default function SupplierResponseSlaChart({
	params,
}: {
	params: StatsParams;
}) {
	const { t } = useTranslation();
	const client = useDcbRestClient();
	const { categorical } = useChartPalette();

	const { data, isLoading, isError, error, refetch, isFetching } = useQuery(
		supplierResponseSlaQueryOptions(client, params),
	);

	const rows = data ?? [];

	return (
		<Card variant="outlined">
			<CardContent>
				<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
					<Typography variant="h6" component="h3">
						{t("insights.charts.supplier_response.title")}
					</Typography>
					<MetricInfo
						metric="supplier_response"
						label={t("insights.charts.supplier_response.title")}
					/>
				</Box>
				<Typography variant="body2" color="text.secondary" gutterBottom>
					{t("insights.charts.supplier_response.subtitle")}
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
							yAxis={[
								{ scaleType: "band", data: rows.map((r) => r.supplierCode) },
							]}
							xAxis={[
								{ label: t("insights.charts.supplier_response.axis_hours") },
							]}
							series={[
								{
									data: rows.map((r) => r.medianResponseSeconds / 3600),
									label: t("insights.charts.supplier_response.series"),
									color: categorical[1],
									valueFormatter: (v) =>
										v == null ? "—" : formatDuration(v * 3600),
								},
							]}
							margin={{ left: 140 }}
						/>
					)}
				</PanelState>
			</CardContent>
		</Card>
	);
}
