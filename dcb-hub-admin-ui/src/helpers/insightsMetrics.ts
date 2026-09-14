/**
 * What every Insights figure counts, how it is computed, and what it leaves out.
 *
 * Read off the SQL in dcb-service's PatronRequestRepository, never inferred from the panel
 * that renders it: a methodology that is nearly right is the text a library quotes back
 * when it disputes a figure. Why one registry rather than three copies, and what the four
 * parts are for: INSIGHTS_IA_AND_UX_PLAN.md section 5.
 *
 * Keys are derived from the id, and insightsMetrics.test.ts fails on a missing part, so
 * the convention cannot rot quietly.
 */

export const METRIC_IDS = [
	// --- the headline five, consortium ------------------------------------------------
	"requests_fulfilled",
	"fill_rate",
	"error_rate",
	"libraries_active",
	// --- the headline five, one library -----------------------------------------------
	"net_flow",
	"items_supplied",
	// --- durations --------------------------------------------------------------------
	"turnaround_to_loan",
	"turnaround_to_finalise",
	"supplier_response",
	"transit_dwell",
	// --- panels whose queries have been read ------------------------------------------
	"failure_taxonomy",
	"supplier_reliability",
	"trading_partners",
	"unfillable_demand",
	"peer_benchmarks",
	"checkout_rate",
	"cost_avoidance",
	// --- trends -----------------------------------------------------------------------
	"request_volume",
	"trend_direction",
	"turnaround_trend",
	"supplier_response_trend",
	"transit_dwell_trend",
] as const;

export type MetricId = (typeof METRIC_IDS)[number];

/** The three static parts. The fourth - how much data - is passed in, because it moves. */
export const methodKeys = (metric: MetricId) => ({
	what: `insights.method.${metric}.what`,
	how: `insights.method.${metric}.how`,
	not: `insights.method.${metric}.not`,
});

/**
 * Below this, a percentile is a story about a handful of requests rather than a measure of
 * a service, and the popover says so. Not a threshold anybody agreed: it is the point at
 * which a single outlier moves the median by more than a working day in the windows this
 * dashboard offers, and it is here rather than inline so it can be argued with in one place.
 */
export const LOW_CONFIDENCE_SAMPLE = 30;
