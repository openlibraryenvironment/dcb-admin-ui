import { describe, expect, it } from "vitest";

import {
	UNDER_CLUSTERED_PCT,
	bucketedHolders,
	isBusy,
	clusterQuality,
	formatMix,
	isUnderClustered,
	rankedProfile,
	uniqueSharePct,
} from "@helpers/insightsCollection";
import type {
	ClusterSizeStat,
	CollectionProfileStat,
	SourceFormatStat,
} from "@helpers/statsApi";

const cluster = (
	holderCount: number,
	clusterCount: number,
): ClusterSizeStat => ({
	holderCount,
	clusterCount,
});

const source = (
	sourceSystemCode: string,
	clusterCount: number,
	uniqueTitleCount: number,
): CollectionProfileStat => ({
	sourceSystemId: `id-${sourceSystemCode}`,
	sourceSystemCode,
	clusterCount,
	uniqueTitleCount,
});

const formatRow = (
	sourceSystemCode: string,
	derivedType: string | null,
	titleCount: number,
): SourceFormatStat => ({
	sourceSystemId: `id-${sourceSystemCode}`,
	sourceSystemCode,
	derivedType,
	titleCount,
});

describe("clusterQuality", () => {
	it("reports the single-holder share, which qualifies every other collection number", () => {
		const q = clusterQuality([
			cluster(1, 300),
			cluster(2, 100),
			cluster(3, 100),
		]);

		expect(q.totalClusters).toBe(500);
		expect(q.singleHolderPct).toBeCloseTo(60);
	});

	it("flags an under-clustered corpus, where the unique-title counts are fiction", () => {
		const q = clusterQuality([cluster(1, 990), cluster(2, 10)]);

		expect(q.singleHolderPct).toBeCloseTo(99);
		expect(isUnderClustered(q)).toBe(true);
	});

	it("does not flag a corpus that clusters", () => {
		expect(
			isUnderClustered(clusterQuality([cluster(1, 400), cluster(2, 600)])),
		).toBe(false);
	});

	it("treats the threshold as inclusive, so the boundary case warns", () => {
		const q = clusterQuality([
			cluster(1, UNDER_CLUSTERED_PCT),
			cluster(2, 100 - UNDER_CLUSTERED_PCT),
		]);

		expect(q.singleHolderPct).toBeCloseTo(UNDER_CLUSTERED_PCT);
		expect(isUnderClustered(q)).toBe(true);
	});

	it("says nothing rather than 0% about an empty corpus", () => {
		const q = clusterQuality([]);

		expect(q.singleHolderPct).toBeNull();
		expect(isUnderClustered(q)).toBe(false);
	});

	it("breaks a modal tie towards the smaller holder count - the pessimistic reading", () => {
		expect(
			clusterQuality([cluster(3, 50), cluster(1, 50)]).commonestHolderCount,
		).toBe(1);
	});
});

describe("bucketedHolders", () => {
	it("keeps one bar per holder count while there are few of them", () => {
		expect(bucketedHolders([cluster(2, 5), cluster(1, 9)])).toEqual([
			{ label: "1", clusterCount: 9 },
			{ label: "2", clusterCount: 5 },
		]);
	});

	it("folds the long tail into one bar, so hundreds of members stay readable", () => {
		const rows = [
			cluster(1, 100),
			cluster(9, 3),
			cluster(40, 2),
			cluster(500, 1),
		];

		expect(bucketedHolders(rows, 8)).toEqual([
			{ label: "1", clusterCount: 100 },
			{ label: "8+", clusterCount: 6 },
		]);
	});

	it("adds no tail bar when nothing reaches it", () => {
		expect(bucketedHolders([cluster(1, 4)], 8).map((b) => b.label)).toEqual([
			"1",
		]);
	});
});

describe("formatMix", () => {
	it("folds one row per (source, format) into one row per format", () => {
		const mix = formatMix([
			formatRow("LIB_A", "Book", 10),
			formatRow("LIB_B", "Book", 5),
			formatRow("LIB_A", "DVD", 4),
		]);

		expect(mix).toEqual([
			{ derivedType: "Book", titleCount: 15 },
			{ derivedType: "DVD", titleCount: 4 },
		]);
	});

	it("keeps an underived type rather than dropping it, so the totals still add up", () => {
		const mix = formatMix([
			formatRow("LIB_A", "Book", 3),
			formatRow("LIB_A", null, 2),
		]);

		expect(mix.map((s) => s.titleCount).reduce((a, b) => a + b)).toBe(5);
		expect(mix.some((s) => s.derivedType === null)).toBe(true);
	});

	it("filters to one source when a library is in scope", () => {
		const mix = formatMix(
			[formatRow("LIB_A", "Book", 10), formatRow("LIB_B", "Book", 5)],
			"LIB_B",
		);

		expect(mix).toEqual([{ derivedType: "Book", titleCount: 5 }]);
	});
});

describe("uniqueSharePct", () => {
	it("is the share of a source's works nobody else holds", () => {
		expect(uniqueSharePct(source("LIB_A", 200, 50))).toBeCloseTo(25);
	});

	it("is null rather than NaN for a source holding nothing", () => {
		expect(uniqueSharePct(source("LIB_EMPTY", 0, 0))).toBeNull();
	});
});

describe("rankedProfile", () => {
	const rows = [
		source("BIG", 1000, 100),
		source("MID", 500, 50),
		source("SMALL", 10, 1),
	];

	it("ranks by works contributed when nothing is in scope", () => {
		expect(
			rankedProfile(rows, undefined, 2).map((r) => r.sourceSystemCode),
		).toEqual(["BIG", "MID"]);
	});

	it("pulls the library in scope to the front, so its own row is never ranked away", () => {
		expect(
			rankedProfile(rows, "SMALL", 2).map((r) => r.sourceSystemCode),
		).toEqual(["SMALL", "BIG"]);
	});

	it("keeps every scoped library even when there are more of them than the limit", () => {
		const codes = rankedProfile(rows, "SMALL,MID,BIG", 1).map(
			(r) => r.sourceSystemCode,
		);

		expect(codes).toHaveLength(3);
		expect(codes).toContain("SMALL");
	});

	it("ignores blank entries in the scope CSV", () => {
		expect(
			rankedProfile(rows, " , ", 1).map((r) => r.sourceSystemCode),
		).toEqual(["BIG"]);
	});
});

describe("isBusy", () => {
	it("recognises the refusal that means the one permit is taken", () => {
		expect(isBusy({ response: { status: 429 } })).toBe(true);
	});

	it("does not treat a real failure as a busy signal", () => {
		// A 500 must not offer "try again shortly" - and must not be silently absorbed
		// into the state that says the numbers are merely being recalculated.
		expect(isBusy({ response: { status: 500 } })).toBe(false);
	});

	it("survives an error with no response at all", () => {
		expect(isBusy(new Error("network down"))).toBe(false);
		expect(isBusy(null)).toBe(false);
		expect(isBusy(undefined)).toBe(false);
	});
});
