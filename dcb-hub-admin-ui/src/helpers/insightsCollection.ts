import {
	ClusterSizeStat,
	CollectionProfileStat,
	SourceFormatStat,
} from "@helpers/statsApi";

/**
 * Derivations over the collection-analysis responses.
 *
 * They live here rather than in the panels because each one is a claim about the corpus
 * that has to be right - the clustering-confidence share in particular decides whether
 * the panel beside it is reporting a fact or an artefact - and a claim that matters is
 * worth a test that does not need a rendered chart to run.
 */

/**
 * dcb-service runs the catalogue-wide aggregates one at a time and answers 429 when a
 * caller has waited out its budget, rather than queueing a second pass over 20M rows.
 *
 * That is an expected answer - "ask again shortly" - not a failure, and it must not be
 * retried automatically: an automatic retry spends the next caller's budget as well. The
 * queries carry retry: false and the panels surface this with a manual retry instead.
 */
const BUSY_STATUS = 429;

export function isBusy(error: unknown): boolean {
	return (
		typeof error === "object" &&
		error !== null &&
		(error as { response?: { status?: number } }).response?.status ===
			BUSY_STATUS
	);
}

export interface ClusterQuality {
	totalClusters: number;
	/** Works held by exactly one source system, as a percentage of all works. */
	singleHolderPct: number | null;
	/** The modal number of holders, for the "typical work" line. */
	commonestHolderCount: number | null;
}

/**
 * The honesty check on every other collection number.
 *
 * A corpus where nearly every cluster has one holder is not a consortium with no
 * duplication - it is a matcher that failed to cluster, and the unique-title counts are
 * then fiction. dcb-service ships this distribution deliberately beside the counts it
 * qualifies; the UI has to actually say so.
 */
export function clusterQuality(rows: ClusterSizeStat[]): ClusterQuality {
	const total = rows.reduce((sum, r) => sum + r.clusterCount, 0);

	if (total === 0) {
		return {
			totalClusters: 0,
			singleHolderPct: null,
			commonestHolderCount: null,
		};
	}

	const single = rows.find((r) => r.holderCount === 1)?.clusterCount ?? 0;

	// Ties resolve to the smaller holder count, which is the pessimistic reading: it
	// reports the corpus as less clustered rather than more.
	const commonest = rows.reduce((best: ClusterSizeStat | null, r) => {
		if (best === null) return r;
		if (r.clusterCount > best.clusterCount) return r;
		if (
			r.clusterCount === best.clusterCount &&
			r.holderCount < best.holderCount
		) {
			return r;
		}
		return best;
	}, null);

	return {
		totalClusters: total,
		singleHolderPct: (single / total) * 100,
		commonestHolderCount: commonest?.holderCount ?? null,
	};
}

/**
 * Above this share of single-holder works, the collection figures are not trustworthy
 * enough to present without a warning beside them. 90% is a judgement, not a measurement:
 * it is high enough that a genuinely diverse consortium will not trip it, and low enough
 * that a matcher which has stopped clustering cannot hide.
 */
export const UNDER_CLUSTERED_PCT = 90;

export function isUnderClustered(quality: ClusterQuality): boolean {
	return (
		quality.singleHolderPct !== null &&
		quality.singleHolderPct >= UNDER_CLUSTERED_PCT
	);
}

export interface HolderBucket {
	/** Display label: the holder count, or "N+" for the folded tail. */
	label: string;
	clusterCount: number;
}

/**
 * Fold the holder distribution into a bounded number of bars.
 *
 * The tail runs to the number of contributing sources - hundreds, at the scale we design
 * for - and a chart with one bar per value is unreadable long before that. Everything
 * from maxBuckets upwards becomes a single "N+" bar, so the shape near 1 (the part that
 * decides whether the corpus is clustered at all) stays legible.
 */
export function bucketedHolders(
	rows: ClusterSizeStat[],
	maxBuckets = 8,
): HolderBucket[] {
	const head = rows
		.filter((r) => r.holderCount < maxBuckets)
		.sort((a, b) => a.holderCount - b.holderCount)
		.map((r) => ({
			label: String(r.holderCount),
			clusterCount: r.clusterCount,
		}));

	const tail = rows
		.filter((r) => r.holderCount >= maxBuckets)
		.reduce((sum, r) => sum + r.clusterCount, 0);

	return tail > 0
		? [...head, { label: `${maxBuckets}+`, clusterCount: tail }]
		: head;
}

export interface FormatSlice {
	/** Null is a real answer - an ingest that could not derive a type. Not dropped. */
	derivedType: string | null;
	titleCount: number;
}

/**
 * Format mix, folded across source systems.
 *
 * The endpoint returns one row per (source, format). At 500 members that is thousands of
 * rows, and a chart with one bar per pair is unreadable - so the consortium view sums by
 * format, and a library scope filters to that library first. Either way the totals still
 * reconcile against the collection profile, because both count works.
 */
export function formatMix(
	rows: SourceFormatStat[],
	sourceCode?: string,
): FormatSlice[] {
	const scoped = sourceCode
		? rows.filter((r) => r.sourceSystemCode === sourceCode)
		: rows;

	const byType = new Map<string | null, number>();
	scoped.forEach((r) => {
		byType.set(r.derivedType, (byType.get(r.derivedType) ?? 0) + r.titleCount);
	});

	return Array.from(byType, ([derivedType, titleCount]) => ({
		derivedType,
		titleCount,
	})).sort((a, b) => b.titleCount - a.titleCount);
}

/** Share of a source's works that no other source holds. Null when it holds nothing. */
export function uniqueSharePct(row: CollectionProfileStat): number | null {
	return row.clusterCount === 0
		? null
		: (row.uniqueTitleCount / row.clusterCount) * 100;
}

/**
 * Rank the profile for display, keeping the libraries in scope visible.
 *
 * A consortium is hundreds of members, so a panel shows a head rather than all of them -
 * but a library administrator looking at their own page must find their own row, and it
 * may not be in the top 25. So the scoped rows are pulled to the front rather than being
 * ranked away. Scope is the CSV the range/scope selector already produces.
 */
export function rankedProfile(
	rows: CollectionProfileStat[],
	scopeCsv: string | undefined,
	limit: number,
): CollectionProfileStat[] {
	const scoped = new Set(
		(scopeCsv ?? "")
			.split(",")
			.map((c) => c.trim())
			.filter(Boolean),
	);

	const ranked = [...rows].sort((a, b) => b.clusterCount - a.clusterCount);

	if (scoped.size === 0) return ranked.slice(0, limit);

	const inScope = ranked.filter((r) => scoped.has(r.sourceSystemCode));
	const rest = ranked.filter((r) => !scoped.has(r.sourceSystemCode));

	return [...inScope, ...rest].slice(0, Math.max(limit, inScope.length));
}
