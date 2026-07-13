import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
	Card,
	CardContent,
	Typography,
	Skeleton,
	Box,
	Stack,
	Select,
	MenuItem,
} from "@mui/material";
import { BarChartPro } from "@mui/x-charts-pro";

import { useDcbRestClient } from "@hooks/useDcbRestClient";
import { useChartPalette } from "@hooks/useChartPalette";
import {
	demandByDimensionQueryOptions,
	StatsParams,
	CollectionDimension,
} from "@helpers/statsApi";

const CHART_HEIGHT = 340;
const DIMENSIONS: CollectionDimension[] = [
	"format",
	"language",
	"subject",
	"decade",
];

// Consortial collection analysis - requesting demand sliced by a chosen bibliographic
// dimension. One panel, a dropdown for the dimension, so we don't ship four near-identical charts.
export default function CollectionDimensionPanel({
	params,
}: {
	params: StatsParams;
}) {
	const { t } = useTranslation();
	const client = useDcbRestClient();
	const { categorical } = useChartPalette();
	const [dimension, setDimension] = useState<CollectionDimension>("format");

	const { data, isLoading } = useQuery(
		demandByDimensionQueryOptions(client, params, dimension),
	);

	const rows = (data ?? []).slice(0, 15);

	return (
		<Card variant="outlined">
			<CardContent>
				<Stack
					direction="row"
					spacing={2}
					sx={{ justifyContent: "space-between", alignItems: "flex-start" }}
				>
					<Box>
						<Typography variant="h6" gutterBottom>
							{t("insights.charts.collection_dimension.title")}
						</Typography>
						<Typography variant="body2" color="text.secondary" gutterBottom>
							{t("insights.charts.collection_dimension.subtitle")}
						</Typography>
					</Box>
					<Select
						size="small"
						value={dimension}
						onChange={(e) =>
							setDimension(e.target.value as CollectionDimension)
						}
						aria-label={t("insights.charts.collection_dimension.select_label")}
					>
						{DIMENSIONS.map((d) => (
							<MenuItem key={d} value={d}>
								{t(`insights.charts.collection_dimension.dim_${d}`)}
							</MenuItem>
						))}
					</Select>
				</Stack>

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
						yAxis={[{ scaleType: "band", data: rows.map((r) => r.category) }]}
						series={[
							{
								data: rows.map((r) => r.requestCount),
								label: t("insights.charts.collection_dimension.series"),
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
