import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, Typography, Skeleton, Box } from "@mui/material";
import { BarChartPro } from "@mui/x-charts-pro";

const CHART_HEIGHT = 320;

interface BarStatPanelProps<T> {
	titleKey: string;
	subtitleKey: string;
	seriesLabelKey: string;
	// A statsApi *QueryOptions(...) result. Built by the parent with the rest client.
	queryOptions: {
		queryKey: readonly unknown[];
		queryFn: () => Promise<T[]>;
	};
	getLabel: (row: T) => string;
	getValue: (row: T) => number;
	color: string;
	horizontal?: boolean;
	limit?: number;
}

// Generic single-series bar panel - one hue, magnitude ranking. Reused for every
// "count by category" stat so we don't duplicate chart boilerplate per endpoint.
export default function BarStatPanel<T>({
	titleKey,
	subtitleKey,
	seriesLabelKey,
	queryOptions,
	getLabel,
	getValue,
	color,
	horizontal = false,
	limit = 15,
}: BarStatPanelProps<T>) {
	const { t } = useTranslation();
	const { data, isLoading } = useQuery(queryOptions);

	const rows = (data ?? []).slice(0, limit);
	const labels = rows.map(getLabel);
	const values = rows.map(getValue);

	const bandAxis = [{ scaleType: "band" as const, data: labels }];
	const series = [{ data: values, label: t(seriesLabelKey), color }];

	return (
		<Card variant="outlined">
			<CardContent>
				<Typography variant="h6" gutterBottom>
					{t(titleKey)}
				</Typography>
				<Typography variant="body2" color="text.secondary" gutterBottom>
					{t(subtitleKey)}
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
				) : horizontal ? (
					<BarChartPro
						height={CHART_HEIGHT}
						layout="horizontal"
						yAxis={bandAxis}
						series={series}
						margin={{ left: 160 }}
					/>
				) : (
					<BarChartPro height={CHART_HEIGHT} xAxis={bandAxis} series={series} />
				)}
			</CardContent>
		</Card>
	);
}
