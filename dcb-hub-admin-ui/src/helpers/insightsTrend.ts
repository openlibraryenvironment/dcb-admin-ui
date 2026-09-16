import type { TimeSeriesPoint } from "@helpers/statsApi";

/**
 * Trends, and the one rule that decides whether an arrow means anything.
 *
 * The three rate trends are derived from the flow series the page already fetches, so they
 * cost no request. The direction rule below is shared with the percentile trends, which do
 * have their own endpoint. Method, caveats and the bucket contract: INSIGHTS_IA_AND_UX_PLAN.md
 * section 6, and dcb-service docs/insights.md 3.9.
 */

/** The status a request enters when DCB accepts it: the denominator of both rates. */
const SUBMITTED = "SUBMITTED_TO_DCB";

export const TREND_IDS = ["volume", "fill_rate", "error_rate"] as const;
export type TrendId = (typeof TREND_IDS)[number];

/** Below this many buckets either side, a direction is noise. */
export const MIN_TREND_BUCKETS = 3;

/** Below this, a percentage-point move is inside the noise the rule exists to suppress. */
export const RATE_NOISE_POINTS = 1;

export interface TrendSeries {
	id: TrendId;
	/** One value per closed bucket, oldest first. A rate is 0-100; volume is a count. */
	values: number[];
	/** The bucket each value belongs to, for the axis and the tooltip. */
	buckets: string[];
	/** True when a larger number is the better outcome. Drives the colour AND the word. */
	higherIsBetter: boolean;
}

export type Direction = "up" | "down" | "flat";

export interface TrendVerdict {
	direction: Direction;
	/** Signed change, in the series' own unit. Zero when the direction is flat. */
	change: number;
	/** True when the direction is the good one. Meaningless when flat. */
	good: boolean;
}

/**
 * The most recent third against the preceding third.
 *
 * A last-bucket-versus-first-bucket comparison moves on a single quiet Tuesday. Thirds mean
 * a direction has to persist across several buckets to show, and the threshold means a
 * difference inside the noise reads as "no clear change" rather than as an arrow.
 *
 * @param noise the smallest change worth calling a direction, in the series' own unit
 */
export function trendVerdict(
	values: number[],
	higherIsBetter: boolean,
	noise: number,
): TrendVerdict | null {
	const third = Math.floor(values.length / 3);

	// Not enough buckets to have a recent third AND a preceding one to compare it with.
	if (third < MIN_TREND_BUCKETS) return null;

	const recent = mean(values.slice(-third));
	const preceding = mean(values.slice(-2 * third, -third));
	const change = recent - preceding;

	if (Math.abs(change) < noise)
		return { direction: "flat", change: 0, good: false };

	const direction: Direction = change > 0 ? "up" : "down";

	return { direction, change, good: change > 0 === higherIsBetter };
}

const mean = (values: number[]) =>
	values.reduce((total, value) => total + value, 0) / values.length;

/**
 * Volume, fill rate and error rate per bucket, from the flow series.
 *
 * THE LAST BUCKET IS DROPPED. It is partial until it closes, so its count is always lower
 * than the ones before it and its rate is computed from a fraction of a period - drawn as a
 * point it invents a fall that has not happened, which is the single most misleading thing a
 * trend can do.
 *
 * A bucket with no submissions contributes no rate rather than a zero: nothing was asked
 * for, so nothing was filled or failed, and a zero would read as total failure.
 */
export function rateTrends(
	points: TimeSeriesPoint[] | undefined,
): TrendSeries[] {
	const buckets = Array.from(new Set((points ?? []).map((p) => p.bucket)))
		.sort()
		.slice(0, -1);

	const countOf = (bucket: string, series: string) =>
		(points ?? []).find((p) => p.bucket === bucket && p.series === series)
			?.count ?? 0;

	const volume = buckets.map((bucket) => countOf(bucket, SUBMITTED));

	const rate = (series: string) =>
		buckets
			.map((bucket, index) => ({
				bucket,
				submitted: volume[index],
				reached: countOf(bucket, series),
			}))
			.filter((row) => row.submitted > 0);

	const filled = rate("LOANED");
	const errored = rate("ERROR");

	return [
		{
			id: "volume",
			values: volume,
			buckets,
			higherIsBetter: true,
		},
		{
			id: "fill_rate",
			values: filled.map((row) => (row.reached / row.submitted) * 100),
			buckets: filled.map((row) => row.bucket),
			higherIsBetter: true,
		},
		{
			id: "error_rate",
			values: errored.map((row) => (row.reached / row.submitted) * 100),
			buckets: errored.map((row) => row.bucket),
			higherIsBetter: false,
		},
	];
}

/** The noise floor for a series: percentage points for a rate, a proportion for a count. */
export const noiseFor = (trend: TrendSeries, latest: number) =>
	trend.id === "volume" ? Math.max(1, latest * 0.05) : RATE_NOISE_POINTS;
