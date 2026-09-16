import { describe, expect, it } from "vitest";

import { MIN_TREND_BUCKETS, rateTrends, trendVerdict } from "./insightsTrend";
import type { TimeSeriesPoint } from "@helpers/statsApi";

/**
 * A trend arrow that moves on noise is worse than no arrow: it is a fact the reader will
 * act on, and it is not one. These tests are the rule from INSIGHTS_IA_AND_UX_PLAN.md
 * section 6.3, stated as behaviour.
 */

const bucket = (n: number) =>
	new Date(Date.UTC(2026, 0, n + 1)).toISOString().slice(0, 10);

/** A flow series: `submitted` per bucket, with `loaned` and `errored` alongside. */
function series(
	rows: ReadonlyArray<[submitted: number, loaned: number, errored: number]>,
): TimeSeriesPoint[] {
	return rows.flatMap(([submitted, loaned, errored], index) => [
		{ bucket: bucket(index), series: "SUBMITTED_TO_DCB", count: submitted },
		{ bucket: bucket(index), series: "LOANED", count: loaned },
		{ bucket: bucket(index), series: "ERROR", count: errored },
	]);
}

describe("the direction rule", () => {
	it("reports no direction at all below the minimum buckets", () => {
		// Eight buckets gives a third of two, under the floor: two buckets either side
		// is a comparison of four days, which moves on a bank holiday.
		expect(trendVerdict([1, 2, 3, 4, 5, 6, 7, 8], true, 1)).toBeNull();
		expect(trendVerdict([], true, 1)).toBeNull();
	});

	it("compares the most recent third against the preceding one", () => {
		// Nine buckets: thirds of three. The last three mean 10, the three before 4.
		const verdict = trendVerdict([1, 1, 1, 4, 4, 4, 10, 10, 10], true, 1);

		expect(verdict).toEqual({ direction: "up", change: 6, good: true });
	});

	it("ignores the buckets before the two thirds it compares", () => {
		// The oldest three are outside the comparison entirely, so a spike there must
		// not move the verdict - the trend is recent behaviour, not the whole window.
		const quiet = trendVerdict([1, 1, 1, 5, 5, 5, 5, 5, 5], true, 1);
		const spiked = trendVerdict([99, 99, 99, 5, 5, 5, 5, 5, 5], true, 1);

		expect(spiked).toEqual(quiet);
	});

	it("says flat rather than inventing a direction inside the noise", () => {
		const verdict = trendVerdict(
			[10, 10, 10, 10, 10, 10, 10.5, 10.5, 10.5],
			true,
			1,
		);

		expect(verdict?.direction).toBe("flat");
		expect(verdict?.change).toBe(0);
	});

	it("knows which direction is the good one, and it is not always up", () => {
		const values = [1, 1, 1, 2, 2, 2, 9, 9, 9];

		// The same rise: good for a fill rate, bad for an error rate. Colour is never the
		// only signal, so this flag drives the word as well as the hue.
		expect(trendVerdict(values, true, 1)?.good).toBe(true);
		expect(trendVerdict(values, false, 1)?.good).toBe(false);
	});

	it("treats a fall the same way, in both senses", () => {
		const values = [9, 9, 9, 5, 5, 5, 1, 1, 1];

		expect(trendVerdict(values, false, 1)).toEqual({
			direction: "down",
			change: -4,
			good: true,
		});
		expect(trendVerdict(values, true, 1)?.good).toBe(false);
	});

	it("floors at three buckets a side", () => {
		// Guards the constant against being lowered without the argument being made.
		expect(MIN_TREND_BUCKETS).toBe(3);
	});
});

describe("the rate trends derived from the flow series", () => {
	it("drops the last bucket, which is partial until it closes", () => {
		// Four buckets in, three out. The last one's count is always lower simply
		// because less of it has happened, and drawn as a point it invents a fall.
		const trends = rateTrends(
			series([
				[100, 90, 5],
				[100, 90, 5],
				[100, 90, 5],
				[7, 6, 0],
			]),
		);

		expect(trends[0].values).toEqual([100, 100, 100]);
		expect(trends[0].buckets).toHaveLength(3);
	});

	it("computes each rate against the submissions in its own bucket", () => {
		const trends = rateTrends(
			series([
				[200, 150, 10],
				[100, 90, 1],
				[0, 0, 0],
			]),
		);

		const fill = trends.find((trend) => trend.id === "fill_rate")!;
		const error = trends.find((trend) => trend.id === "error_rate")!;

		expect(fill.values).toEqual([75, 90]);
		expect(error.values).toEqual([5, 1]);
	});

	it("omits a bucket nobody asked anything in, rather than calling it zero", () => {
		// No submissions means nothing was filled and nothing failed. A zero rate would
		// read as total failure and drag the direction with it.
		const trends = rateTrends(
			series([
				[100, 90, 5],
				[0, 0, 0],
				[100, 90, 5],
				[1, 1, 0],
			]),
		);

		const fill = trends.find((trend) => trend.id === "fill_rate")!;

		expect(fill.values).toEqual([90, 90]);
		expect(fill.buckets).toHaveLength(2);

		// Volume keeps the zero: nothing was asked for IS the fact there.
		expect(trends[0].values).toEqual([100, 0, 100]);
	});

	it("knows error rate is the one where up is bad", () => {
		const trends = rateTrends(
			series([
				[1, 1, 0],
				[1, 1, 0],
			]),
		);

		expect(trends.map((trend) => [trend.id, trend.higherIsBetter])).toEqual([
			["volume", true],
			["fill_rate", true],
			["error_rate", false],
		]);
	});

	it("survives an empty window without throwing", () => {
		expect(rateTrends([]).every((trend) => trend.values.length === 0)).toBe(
			true,
		);
		expect(
			rateTrends(undefined).every((trend) => trend.buckets.length === 0),
		).toBe(true);
	});
});
