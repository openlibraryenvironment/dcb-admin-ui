import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
	Box,
	Card,
	CardContent,
	Skeleton,
	Stack,
	Typography,
} from "@mui/material";
import { ArrowDropDown, ArrowDropUp, Remove } from "@mui/icons-material";
import { SparkLineChart } from "@mui/x-charts-pro";
import { visuallyHidden } from "@mui/utils";

import { useDcbRestClient } from "@hooks/useDcbRestClient";
import { useChartPalette } from "@hooks/useChartPalette";
import MetricInfo from "./MetricInfo";
import PanelState from "./PanelState";
import {
	TrendSeries,
	noiseFor,
	rateTrends,
	trendVerdict,
} from "@helpers/insightsTrend";
import type { MetricId } from "@helpers/insightsMetrics";
import {
	timeSeriesQueryOptions,
	StatsParams,
	TimeSeriesInterval,
} from "@helpers/statsApi";

/**
 * Is it getting better or worse?
 *
 * Three trends from the series the page has already fetched - same query key as the flow
 * chart below, so this costs no request. What the arrow is allowed to mean is the rule in
 * `insightsTrend`, and it is the same rule for the percentile trends beside it.
 */

const SPARK_HEIGHT = 56;
const STRIP_HEIGHT = 188;

/** Which registry entry explains each trend. */
const METRIC: Record<string, MetricId> = {
	volume: "request_volume",
	fill_rate: "fill_rate",
	error_rate: "error_rate",
};

export default function TrendStrip({
	params,
	interval,
}: {
	params: StatsParams;
	interval: TimeSeriesInterval;
}) {
	const { t } = useTranslation();
	const client = useDcbRestClient();
	const { categorical } = useChartPalette();

	const { data, isLoading, isError, error, refetch, isFetching } = useQuery(
		timeSeriesQueryOptions(client, params, interval),
	);

	const trends = useMemo(() => rateTrends(data), [data]);

	return (
		<Card variant="outlined">
			<CardContent>
				<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
					<Typography variant="h6" component="h3">
						{t("insights.trends.strip.title")}
					</Typography>
					<MetricInfo
						metric="trend_direction"
						label={t("insights.trends.strip.title")}
					/>
				</Box>
				<Typography variant="body2" color="text.secondary" gutterBottom>
					{t("insights.trends.strip.subtitle")}
				</Typography>

				<PanelState
					isLoading={isLoading}
					isError={isError}
					error={error}
					isEmpty={trends.every((trend) => trend.values.length === 0)}
					onRetry={refetch}
					isRetrying={isFetching}
					height={STRIP_HEIGHT}
				>
					{() => (
						<Box
							sx={{
								display: "grid",
								gap: 2,
								gridTemplateColumns: {
									xs: "1fr",
									md: "repeat(3, 1fr)",
								},
							}}
						>
							{trends.map((trend) => (
								<TrendTile
									key={trend.id}
									trend={trend}
									colour={categorical[0]}
								/>
							))}
						</Box>
					)}
				</PanelState>
			</CardContent>
		</Card>
	);
}

function TrendTile({ trend, colour }: { trend: TrendSeries; colour: string }) {
	const { t } = useTranslation();

	const latest = trend.values.at(-1);
	const verdict =
		latest === undefined
			? null
			: trendVerdict(
					trend.values,
					trend.higherIsBetter,
					noiseFor(trend, latest),
				);

	const title = t(`insights.trends.${trend.id}.title`);
	const format = (value: number) =>
		trend.id === "volume"
			? Math.round(value).toLocaleString()
			: `${value.toFixed(1)}%`;

	return (
		<Box>
			<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
				<Typography variant="subtitle2" component="p" color="text.secondary">
					{title}
				</Typography>
				<MetricInfo
					metric={METRIC[trend.id]}
					// NOT just the tile's title: the headline figure above carries the
					// same words, and two buttons with one accessible name is a reader
					// listing the page's controls and hearing the same sentence twice.
					label={t("insights.trends.over_time", { label: title })}
					sampleCount={trend.values.length}
				/>
			</Box>

			<Typography variant="h4" component="p">
				{latest === undefined ? "—" : format(latest)}
			</Typography>

			<Verdict trend={trend} verdict={verdict} format={format} />

			{/* The figures above carry the whole message, so the line is supporting
			    detail rather than the only statement of it. `inert` as well as
			    aria-hidden: the chart surface is focusable, and an aria-hidden subtree
			    holding a focusable element is a keyboard user tabbing into something a
			    screen reader will not announce - WCAG 4.1.2, and caught by Lighthouse's
			    aria-hidden-focus rather than by the axe tag sets we assert. */}
			<Box inert aria-hidden sx={{ mt: 1 }}>
				{trend.values.length > 1 ? (
					<SparkLineChart
						data={trend.values}
						height={SPARK_HEIGHT}
						color={colour}
						area
						showHighlight
						valueFormatter={(value) => (value === null ? "" : format(value))}
					/>
				) : (
					<Skeleton
						variant="rectangular"
						height={SPARK_HEIGHT}
						animation={false}
					/>
				)}
			</Box>

			<Typography sx={visuallyHidden}>
				{t("insights.trends.buckets_counted", { count: trend.values.length })}
			</Typography>
		</Box>
	);
}

/**
 * The direction, in a word as well as a colour and an arrow.
 *
 * "Up" is good for a fill rate and bad for an error rate, so the word is what carries the
 * meaning; the hue only repeats it. Colour is never the only signal.
 */
function Verdict({
	trend,
	verdict,
	format,
}: {
	trend: TrendSeries;
	verdict: ReturnType<typeof trendVerdict>;
	format: (value: number) => string;
}) {
	const { t } = useTranslation();

	if (!verdict) {
		return (
			<Typography variant="body2" color="text.secondary">
				{t("insights.trends.too_short")}
			</Typography>
		);
	}

	if (verdict.direction === "flat") {
		return (
			<Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
				<Remove fontSize="small" />
				<Typography variant="body2" color="text.secondary">
					{t("insights.trends.flat")}
				</Typography>
			</Stack>
		);
	}

	const Arrow = verdict.direction === "up" ? ArrowDropUp : ArrowDropDown;

	return (
		<Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
			<Arrow fontSize="small" color={verdict.good ? "success" : "error"} />
			<Typography
				variant="body2"
				color={verdict.good ? "success.main" : "error.main"}
			>
				{t(`insights.trends.${verdict.direction}`, {
					change: format(Math.abs(verdict.change)),
					label: t(`insights.trends.${trend.id}.title`).toLowerCase(),
				})}
			</Typography>
		</Stack>
	);
}
