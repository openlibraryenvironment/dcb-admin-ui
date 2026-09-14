import type { StatsParams } from "@helpers/statsApi";

/**
 * Turning a panel's context into a patron request filter.
 *
 * The grid already takes a Lucene-style query and composes it with the tab's own preset, so
 * a drill-down is a query string in the URL - no new endpoint and no change to the query
 * language. Which panels earn a link, and which deliberately do not:
 * INSIGHTS_IA_AND_UX_PLAN.md section 8.2.
 *
 * Every field named here is asserted against a real database in dcb-service's
 * PatronRequestQueryFilterTests. That matters more than it looks: the frontend cannot tell
 * a filter the parser REJECTS from one that legitimately matches nothing, because both
 * arrive as an empty grid.
 */

/**
 * The two characters that mean anything inside a quoted phrase: the quote that would end
 * it, and the backslash that would escape whatever follows.
 *
 * Deliberately NOT the whole special-character set. Every value here is quoted, and inside
 * quotes Lucene takes the rest literally - escaping a hyphen would turn `alpha-lms`, which
 * is what a Host LMS code looks like, into `alpha\-lms`, and whether that still matches the
 * stored value is exactly the kind of thing this should not be guessing about.
 */
const MUST_ESCAPE = ['"', "\\"];

/** A quoted term whose value cannot end the quote or escape past it. */
const term = (field: string, value: string) => {
	const escaped = [...value]
		.map((char) => (MUST_ESCAPE.includes(char) ? "\\" + char : char))
		.join("");

	return `${field}:"${escaped}"`;
};

/**
 * An identifier, unquoted.
 *
 * A UUID carries no Lucene syntax, and quoting it makes the parser read it as a phrase
 * rather than as the field comparison the column needs.
 */
const identifier = (field: string, value: string) => `${field}:${value}`;

/**
 * The window, in the range syntax the grid's own date filters already use.
 *
 * `dateCreated` is when the request ARRIVED, which is what the Insights panels count by, so
 * a drill-down keyed on any other date would return a different set from the number that
 * was clicked.
 */
const inWindow = ({ startDate, endDate }: StatsParams) =>
	startDate && endDate ? `dateCreated:[${startDate} TO ${endDate}]` : "";

const and = (...parts: (string | undefined)[]) => {
	const present = parts.filter((part): part is string => !!part);
	return present.length > 1 ? present.join(" AND ") : (present[0] ?? "");
};

/** Every drill-down destination, so a link cannot name a route that does not exist. */
export const DRILL_ROUTES = {
	all: "/patronRequests/all",
	exception: "/patronRequests/exception",
} as const;

export type DrillRoute = (typeof DRILL_ROUTES)[keyof typeof DRILL_ROUTES];

export interface Drill {
	to: DrillRoute;
	/** The composed filter, ANDed with whatever preset the destination tab carries. */
	q: string;
}

/**
 * Why a request failed, as the grid filters it.
 *
 * On the status the request was in when it failed, not on the ERROR status itself - the
 * destination tab already carries that, and the taxonomy's bars ARE the previous statuses.
 */
export const failureDrill = (reason: string, params: StatsParams): Drill => ({
	to: DRILL_ROUTES.exception,
	q: and(term("previousStatus", reason), inWindow(params)),
});

/** One supplier's requests, in the window the panel counted. */
export const supplierDrill = (
	supplierCode: string,
	params: StatsParams,
): Drill => ({
	to: DRILL_ROUTES.all,
	q: and(term("supplyingAgencyCode", supplierCode), inWindow(params)),
});

/**
 * One trading pair, in the direction the list is showing.
 *
 * Borrower and supplier both, because a pair is not a partner: the panel's number is the
 * traffic BETWEEN them, and either half alone is a larger set.
 */
export const partnerDrill = (
	borrowerCode: string,
	supplierCode: string,
	params: StatsParams,
): Drill => ({
	to: DRILL_ROUTES.all,
	q: and(
		term("patronHostlmsCode", borrowerCode),
		term("supplyingAgencyCode", supplierCode),
		inWindow(params),
	),
});

/** Every request for one work, in the window. */
export const clusterDrill = (
	clusterId: string,
	params: StatsParams,
): Drill => ({
	to: DRILL_ROUTES.all,
	q: and(identifier("bibClusterId", clusterId), inWindow(params)),
});

/** Everything that failed in the window - the headline error rate, and its trend. */
export const errorDrill = (params: StatsParams): Drill => ({
	to: DRILL_ROUTES.exception,
	q: inWindow(params),
});
