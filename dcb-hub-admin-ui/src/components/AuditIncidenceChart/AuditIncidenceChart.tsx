import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
	Box,
	Card,
	CardContent,
	Skeleton,
	Stack,
	ToggleButton,
	ToggleButtonGroup,
	Tooltip,
	Typography,
} from "@mui/material";
import { BarChartPro } from "@mui/x-charts-pro";
import dayjs from "dayjs";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useChartPalette } from "@hooks/useChartPalette";
import { getAuditIncidence } from "@queries/getAuditIncidence";
import { rangeToParams } from "@helpers/insightsRange";
import type { RangePreset } from "@hooks/insightsPlotStore";
import type {
	LoadAuditIncidenceQuery,
	LoadAuditIncidenceQueryVariables,
} from "@generated/graphql";

const CHART_HEIGHT = 300;

type BucketUnit = "hour" | "day" | "week";
type Interval = Uppercase<BucketUnit>;

// Postgres aggregates the whole matching set, so the bucket width has to be chosen
// before the data arrives rather than derived from its span - hence explicit controls
// rather than the old client-side heuristic.
const INTERVALS: Interval[] = ["HOUR", "DAY", "WEEK"];
const RANGES: RangePreset[] = ["7d", "30d", "90d", "365d"];

// A bounded window is not a nicety. Unbounded, the aggregate covers all history: a
// deployment with more than ~2.7 years of audits exceeds the server's bucket ceiling on
// DAY and the query is REJECTED outright, and the scan cost grows with the whole table
// rather than the window. 90 days keeps both bounded.
const DEFAULT_RANGE: RangePreset = "90d";
const DEFAULT_INTERVAL: Interval = "DAY";

// Mirrors MAX_BUCKETS in AuditIncidenceService. Kept here so an over-long combination is
// disabled in the UI rather than sent and refused - the server still enforces it.
const MAX_BUCKETS = 1000;

const RANGE_DAYS: Record<RangePreset, number> = {
	"7d": 7,
	"30d": 30,
	"90d": 90,
	"365d": 365,
};

const INTERVAL_DAYS: Record<Interval, number> = {
	HOUR: 1 / 24,
	DAY: 1,
	WEEK: 7,
};

const LABEL_FORMATS: Record<BucketUnit, string> = {
	hour: "DD MMM HH:00",
	day: "DD MMM YYYY",
	week: "DD MMM YYYY",
};

const bucketsFor = (range: RangePreset, interval: Interval): number =>
	Math.ceil(RANGE_DAYS[range] / INTERVAL_DAYS[interval]);

export default function AuditIncidenceChart({ query }: { query: string }) {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();
	const { categorical } = useChartPalette();

	const [range, setRange] = useState<RangePreset>(DEFAULT_RANGE);
	const [interval, setInterval] = useState<Interval>(DEFAULT_INTERVAL);

	const { startDate, endDate } = useMemo(() => rangeToParams(range), [range]);

	const { data, isLoading, isError } = useQuery({
		queryKey: ["auditIncidence", query, interval, startDate, endDate],
		queryFn: () =>
			gqlClient.request<
				LoadAuditIncidenceQuery,
				LoadAuditIncidenceQueryVariables
			>(getAuditIncidence, {
				query,
				interval,
				start: startDate,
				end: endDate,
			}),
		placeholderData: (previousData) => previousData,
	});

	const buckets = useMemo(() => data?.auditIncidence?.buckets ?? [], [data]);

	// Echoed back by the server so the axis is labelled with the width it actually used.
	const unit = (
		data?.auditIncidence?.interval ?? interval
	).toLowerCase() as BucketUnit;

	const { labels, counts } = useMemo(() => {
		const format = LABEL_FORMATS[unit] ?? LABEL_FORMATS.day;

		return {
			labels: buckets.map((bucket) => dayjs(bucket.bucketStart).format(format)),
			counts: buckets.map((bucket) => bucket.count),
		};
	}, [buckets, unit]);

	// Widening the range can invalidate the chosen width (hourly over a year is 8760
	// buckets), so the width falls back with it rather than being left impossible.
	const selectRange = (next: RangePreset) => {
		setRange(next);

		if (bucketsFor(next, interval) > MAX_BUCKETS) setInterval(DEFAULT_INTERVAL);
	};

	const intervalLabel = t(`audit_explorer.chart.interval.${unit}`);

	return (
		<Card variant="outlined">
			<CardContent>
				<Stack
					direction="row"
					spacing={2}
					sx={{
						justifyContent: "space-between",
						alignItems: "flex-start",
						flexWrap: "wrap",
					}}
				>
					<Box>
						<Typography variant="h6" gutterBottom>
							{t("audit_explorer.chart.title")}
						</Typography>
						<Typography variant="body2" color="text.secondary" gutterBottom>
							{isLoading || labels.length === 0
								? t("audit_explorer.chart.subtitle")
								: t("audit_explorer.chart.subtitle_interval", {
										interval: intervalLabel,
									})}
						</Typography>
					</Box>
					<Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
						<ToggleButtonGroup
							exclusive
							size="small"
							value={range}
							aria-label={t("audit_explorer.chart.range_label")}
							onChange={(_event, next: RangePreset | null) => {
								// Exclusive groups report null when the active button is clicked
								// again; keep the current window rather than selecting none.
								if (next) selectRange(next);
							}}
						>
							{RANGES.map((option) => (
								<ToggleButton key={option} value={option}>
									{t(`audit_explorer.chart.range_option.${option}`)}
								</ToggleButton>
							))}
						</ToggleButtonGroup>
						<ToggleButtonGroup
							exclusive
							size="small"
							value={interval}
							aria-label={t("audit_explorer.chart.interval_label")}
							onChange={(_event, next: Interval | null) => {
								if (next) setInterval(next);
							}}
						>
							{INTERVALS.map((option) => {
								const tooLong = bucketsFor(range, option) > MAX_BUCKETS;

								return (
									<Tooltip
										key={option}
										title={
											tooLong ? t("audit_explorer.chart.interval_too_fine") : ""
										}
									>
										{/* Span keeps the tooltip reachable: MUI does not fire
										    pointer events on a disabled button. */}
										<span>
											<ToggleButton value={option} disabled={tooLong}>
												{t(
													`audit_explorer.chart.interval_option.${option.toLowerCase()}`,
												)}
											</ToggleButton>
										</span>
									</Tooltip>
								);
							})}
						</ToggleButtonGroup>
					</Stack>
				</Stack>

				{isLoading ? (
					<Skeleton variant="rounded" height={CHART_HEIGHT} />
				) : isError || labels.length === 0 ? (
					<Box
						sx={{
							height: CHART_HEIGHT,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<Typography color="text.secondary">
							{isError
								? t("audit_explorer.chart.error")
								: t("audit_explorer.chart.no_data")}
						</Typography>
					</Box>
				) : (
					<BarChartPro
						height={CHART_HEIGHT}
						xAxis={[{ scaleType: "band", data: labels }]}
						series={[
							{
								data: counts,
								label: t("audit_explorer.chart.series"),
								color: categorical[5],
							},
						]}
					/>
				)}
			</CardContent>
		</Card>
	);
}
