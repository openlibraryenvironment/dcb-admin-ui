import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, Typography, Skeleton, Box } from "@mui/material";
import { BarChartPro } from "@mui/x-charts-pro";

import { useDcbRestClient } from "@hooks/useDcbRestClient";
import { useChartPalette } from "@hooks/useChartPalette";
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

	const { data, isLoading } = useQuery(
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
				<Typography variant="h6" gutterBottom>
					{t("insights.charts.supplier_reliability.title")}
				</Typography>
				<Typography variant="body2" color="text.secondary" gutterBottom>
					{t("insights.charts.supplier_reliability.subtitle")}
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
			</CardContent>
		</Card>
	);
}
