import type { MetricId } from "@helpers/insightsMetrics";
import type {
	StatusDwellStat,
	SupplierResponseStat,
	TurnaroundStat,
} from "@helpers/statsApi";

/**
 * The five named durations, assembled from the three endpoints that measure them.
 *
 * Here rather than in the panel because every rule below is a claim that has to be right,
 * and the wrong answer to any of them is a number a library is judged on. Same reason
 * insightsCollection is a helper.
 */

export interface DurationRow {
	/** Translation key for the name a reader sees. */
	key: string;
	/** Which registry entry explains it. Transit shares one: both legs are the same measure. */
	metric: MetricId;
	/** The transition it measures, shown small beneath the name. */
	detail: string;
	p50Seconds: number | null;
	p95Seconds: number | null;
	/** Only the two endpoints that report one; null where the API does not carry it. */
	sampleCount: number | null;
	/** No observations at all. A zero here would read as instant. */
	absent: boolean;
}

export interface DurationInputs {
	toLoaned?: TurnaroundStat;
	toFinalised?: TurnaroundStat;
	/** Rows from /insights/supplier-response-sla, one per supplying Host LMS. */
	supplierResponse?: SupplierResponseStat[];
	/** Rows from /insights/time-in-status, one per status. */
	dwell?: StatusDwellStat[];
	/** How many Host LMS codes the view is scoped to; 0 is the whole consortium. */
	scopedCodes: number;
}

/**
 * dcb-service COALESCEs an empty percentile window to (0, 0), so a pair of zeroes is "no
 * request reached this status", not "it took no time". Reporting that as 0s would be the
 * most flattering possible lie.
 */
const noObservations = (stat?: TurnaroundStat) =>
	!stat || (stat.p50Seconds === 0 && stat.p95Seconds === 0);

const turnaround = (
	key: string,
	metric: MetricId,
	detail: string,
	stat?: TurnaroundStat,
): DurationRow => ({
	key,
	metric,
	detail,
	// The turnaround endpoints return percentiles and nothing else, so there is no count
	// to show. An estimate would be worse than the blank.
	sampleCount: null,
	p50Seconds: noObservations(stat) ? null : (stat?.p50Seconds ?? null),
	p95Seconds: noObservations(stat) ? null : (stat?.p95Seconds ?? null),
	absent: noObservations(stat),
});

const fromDwell = (
	key: string,
	status: string,
	rows?: StatusDwellStat[],
): DurationRow => {
	const row = rows?.find((candidate) => candidate.status === status);

	return {
		key,
		metric: "transit_dwell",
		detail: status,
		// Dwell is a median only - there is no p95 in StatusDwellStat.
		p50Seconds: row?.medianDwellSeconds ?? null,
		p95Seconds: null,
		sampleCount: row?.sampleCount ?? null,
		// A host LMS that never reports the transition produces no row at all, which is a
		// different thing from a fast leg and has to read differently.
		absent: !row,
	};
};

export function durationRows({
	toLoaned,
	toFinalised,
	supplierResponse,
	dwell,
	scopedCodes,
}: DurationInputs): DurationRow[] {
	const rows: DurationRow[] = [
		turnaround(
			"insights.durations.to_loan",
			"turnaround_to_loan",
			"LOANED",
			toLoaned,
		),
		turnaround(
			"insights.durations.to_finalise",
			"turnaround_to_finalise",
			"FINALISED",
			toFinalised,
		),
	];

	// Supplier response is per SUPPLYING library, so it is one number only when the view
	// is one library. Across a set, the endpoint returns a median per supplier and the
	// median of those is a different statistic with the same name - so it is omitted
	// rather than computed, and the per-supplier chart answers it instead.
	if (scopedCodes === 1) {
		const row = supplierResponse?.[0];

		rows.push({
			key: "insights.durations.supplier_response",
			metric: "supplier_response",
			detail: "PLACED -> CONFIRMED",
			p50Seconds: row?.medianResponseSeconds ?? null,
			p95Seconds: null,
			sampleCount: row?.sampleCount ?? null,
			absent: !row,
		});
	}

	rows.push(
		fromDwell("insights.durations.transit_out", "PICKUP_TRANSIT", dwell),
		fromDwell("insights.durations.transit_back", "RETURN_TRANSIT", dwell),
	);

	return rows;
}

/** The longest bar to scale against; 0 when nothing was observed at all. */
export function longestDuration(rows: DurationRow[]): number {
	return rows.reduce(
		(longest, row) => Math.max(longest, row.p95Seconds ?? row.p50Seconds ?? 0),
		0,
	);
}
