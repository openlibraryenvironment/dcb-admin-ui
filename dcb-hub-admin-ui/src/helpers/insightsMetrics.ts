/**
 * What every Insights figure counts, how it is computed, and what it leaves out.
 *
 * ONE registry, because the same four answers are wanted in three places: the popover a
 * reader opens beside a number, the documentation page that will be generated from this,
 * and the header rows of an export. Three copies of a definition is one copy nobody
 * updates, and the copy beside the number is the one people trust.
 *
 * Every entry here was read off the SQL in dcb-service's PatronRequestRepository, not
 * inferred from the panel that renders it. A methodology that is nearly right is worse
 * than none: it is the thing a library will quote back when it disputes a figure.
 *
 * Translation keys are derived from the id by convention -
 * `insights.method.<id>.{what,how,not}` - and insightsMetrics.test.ts fails if any of the
 * three is missing, so the convention cannot rot quietly.
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
