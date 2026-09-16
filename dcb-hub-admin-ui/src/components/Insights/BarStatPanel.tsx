import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Box, Card, CardContent, Typography } from "@mui/material";
import { BarChartPro } from "@mui/x-charts-pro";

import PanelState from "./PanelState";

import { MetricId } from "@helpers/insightsMetrics";
import MetricInfo from "./MetricInfo";

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
	/** Set by callers whose figure has a registry entry; see insightsMetrics. */
	metric?: MetricId;
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
	metric,
	getValue,
	color,
	horizontal = false,
	limit = 15,
}: BarStatPanelProps<T>) {
	const { t } = useTranslation();
	const { data, isLoading, isError, error, refetch, isFetching } =
		useQuery(queryOptions);

	const rows = (data ?? []).slice(0, limit);
	const labels = rows.map(getLabel);
	const values = rows.map(getValue);

	const bandAxis = [{ scaleType: "band" as const, data: labels }];
	const series = [{ data: values, label: t(seriesLabelKey), color }];

	return (
		<Card variant="outlined">
			<CardContent>
				<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
					<Typography variant="h6" component="h3">
						{t(titleKey)}
					</Typography>
					{metric ? <MetricInfo metric={metric} label={t(titleKey)} /> : null}
				</Box>
				<Typography variant="body2" color="text.secondary" gutterBottom>
					{t(subtitleKey)}
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
					{() =>
						horizontal ? (
							<BarChartPro
								height={CHART_HEIGHT}
								layout="horizontal"
								yAxis={bandAxis}
								series={series}
								margin={{ left: 160 }}
							/>
						) : (
							<BarChartPro
								height={CHART_HEIGHT}
								xAxis={bandAxis}
								series={series}
							/>
						)
					}
				</PanelState>
			</CardContent>
		</Card>
	);
}
