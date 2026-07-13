import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
	Card,
	CardContent,
	Typography,
	Skeleton,
	Box,
	useTheme,
} from "@mui/material";
import { Heatmap } from "@mui/x-charts-pro";

import { useDcbRestClient } from "@hooks/useDcbRestClient";
import { demandHeatmapQueryOptions, StatsParams } from "@helpers/statsApi";

const CHART_HEIGHT = 300;
const HOURS = Array.from({ length: 24 }, (_, h) => h);

// Localised short weekday names, index 0 = Sunday (matches Postgres DOW). Jan 1
// 2023 was a Sunday, so we offset from there - no hardcoded English day names.
function weekdayLabels(): string[] {
	const fmt = new Intl.DateTimeFormat(undefined, { weekday: "short" });
	return Array.from({ length: 7 }, (_, d) =>
		fmt.format(new Date(Date.UTC(2023, 0, 1 + d))),
	);
}

// Sequential single-hue ramp per the dataviz rule (light -> dark, one hue).
function heatRamp(isDark: boolean): [string, string] {
	return isDark ? ["#12233d", "#3987e5"] : ["#e8eefc", "#2a78d6"];
}

export default function DemandHeatmapChart({
	params,
}: {
	params: StatsParams;
}) {
	const { t } = useTranslation();
	const client = useDcbRestClient();
	const isDark = useTheme().palette.mode === "dark";

	const { data, isLoading } = useQuery(
		demandHeatmapQueryOptions(client, params),
	);

	const days = useMemo(() => weekdayLabels(), []);

	const { series, maxCount } = useMemo(() => {
		const cells = data ?? [];
		const heatmapData = cells.map(
			(c) => [c.hourOfDay, c.dayOfWeek, c.requestCount] as const,
		);
		const max = cells.reduce((m, c) => Math.max(m, c.requestCount), 0);
		return {
			series: [
				{ data: heatmapData.map((d) => [...d] as [number, number, number]) },
			],
			maxCount: max,
		};
	}, [data]);

	return (
		<Card variant="outlined">
			<CardContent>
				<Typography variant="h6" gutterBottom>
					{t("insights.charts.demand_heatmap.title")}
				</Typography>
				<Typography variant="body2" color="text.secondary" gutterBottom>
					{t("insights.charts.demand_heatmap.subtitle")}
				</Typography>

				{isLoading ? (
					<Skeleton variant="rounded" height={CHART_HEIGHT} />
				) : maxCount === 0 ? (
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
					// The 24-hour axis is wide; allow horizontal scroll on narrow screens.
					<Box sx={{ overflowX: "auto" }}>
						<Box sx={{ minWidth: 640 }}>
							<Heatmap
								height={CHART_HEIGHT}
								xAxis={[{ data: HOURS }]}
								yAxis={[{ data: days }]}
								zAxis={[
									{
										min: 0,
										max: maxCount,
										colorMap: {
											type: "continuous",
											min: 0,
											max: maxCount,
											color: heatRamp(isDark),
										},
									},
								]}
								series={series}
							/>
						</Box>
					</Box>
				)}
			</CardContent>
		</Card>
	);
}
