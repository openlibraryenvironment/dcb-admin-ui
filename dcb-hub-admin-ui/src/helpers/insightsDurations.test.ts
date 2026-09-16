import { describe, it, expect } from "vitest";

import { durationRows, longestDuration } from "./insightsDurations";
import { activeSystems } from "./insightsHeadline";

/**
 * Every rule here is the difference between a figure a library can act on and one that
 * flatters it. The zero cases matter most: dcb-service COALESCEs an empty percentile
 * window to (0, 0), and a host LMS that never reports a transit status produces no row at
 * all - both of which a naive panel renders as "instant".
 */
describe("the five named durations", () => {
	const dwell = [
		{
			status: "PICKUP_TRANSIT",
			medianDwellSeconds: 108_000,
			sampleCount: 5233,
		},
		{ status: "SOMETHING_ELSE", medianDwellSeconds: 60, sampleCount: 4 },
	];

	it("reads an empty percentile window as absent, not as instant", () => {
		const [toLoan] = durationRows({
			toLoaned: { p50Seconds: 0, p95Seconds: 0 },
			scopedCodes: 1,
		});

		expect(toLoan.absent).toBe(true);
		expect(toLoan.p50Seconds).toBeNull();
	});

	it("carries a real percentile pair through", () => {
		const [toLoan] = durationRows({
			toLoaned: { p50Seconds: 187_200, p95Seconds: 540_000 },
			scopedCodes: 1,
		});

		expect(toLoan.absent).toBe(false);
		expect(toLoan.p50Seconds).toBe(187_200);
		expect(toLoan.p95Seconds).toBe(540_000);
		// The endpoint returns percentiles only, so there is no count to claim.
		expect(toLoan.sampleCount).toBeNull();
	});

	it("marks a transit leg no system reported as absent, and keeps the one that was", () => {
		const rows = durationRows({ dwell, scopedCodes: 0 });
		const byKey = Object.fromEntries(rows.map((row) => [row.key, row]));

		expect(byKey["insights.durations.transit_out"].p50Seconds).toBe(108_000);
		expect(byKey["insights.durations.transit_out"].sampleCount).toBe(5233);
		expect(byKey["insights.durations.transit_out"].absent).toBe(false);

		expect(byKey["insights.durations.transit_back"].absent).toBe(true);
		expect(byKey["insights.durations.transit_back"].p50Seconds).toBeNull();
	});

	it("omits supplier response unless the view is one library", () => {
		const response = [
			{
				supplierCode: "LIB_A",
				medianResponseSeconds: 21_600,
				sampleCount: 900,
			},
			{
				supplierCode: "LIB_B",
				medianResponseSeconds: 40_000,
				sampleCount: 700,
			},
		];

		const consortium = durationRows({
			supplierResponse: response,
			scopedCodes: 0,
		});
		expect(
			consortium.some(
				(row) => row.key === "insights.durations.supplier_response",
			),
		).toBe(false);

		// A median of per-supplier medians is a different statistic wearing the same name,
		// so across a set the per-supplier chart answers this instead.
		const oneLibrary = durationRows({
			supplierResponse: [response[0]],
			scopedCodes: 1,
		});
		const row = oneLibrary.find(
			(candidate) => candidate.key === "insights.durations.supplier_response",
		);

		expect(row?.p50Seconds).toBe(21_600);
		expect(row?.sampleCount).toBe(900);
	});

	it("scales to the longest bar it actually has", () => {
		const rows = durationRows({
			toLoaned: { p50Seconds: 187_200, p95Seconds: 540_000 },
			dwell,
			scopedCodes: 0,
		});

		expect(longestDuration(rows)).toBe(540_000);
		expect(longestDuration(durationRows({ scopedCodes: 0 }))).toBe(0);
	});
});

describe("libraries active", () => {
	it("counts the systems that borrowed or supplied, and no others", () => {
		expect(
			activeSystems([
				{ libraryCode: "A", borrowedCount: 12, suppliedCount: 0 },
				{ libraryCode: "B", borrowedCount: 0, suppliedCount: 7 },
				{ libraryCode: "C", borrowedCount: 0, suppliedCount: 0 },
			]),
		).toBe(2);
	});

	it("is zero, not an error, before the answer arrives", () => {
		expect(activeSystems(undefined)).toBe(0);
	});
});
