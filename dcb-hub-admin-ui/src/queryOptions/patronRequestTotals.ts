import { queryOptions } from "@tanstack/react-query";
import { GraphQLClient } from "graphql-request";

import { getPatronRequestTotals } from "@queries/getPatronRequestTotals";
import { queries } from "@constants/patronRequestGridQueries";
import type { LoadPatronRequestTotalsQueryVariables } from "@generated/graphql";

/** The four buckets the patron-request tab bar counts. */
export type PatronRequestBucket =
	"exception" | "outOfSequence" | "inProgress" | "finished";

export const PATRON_REQUEST_BUCKETS: PatronRequestBucket[] = [
	"exception",
	"outOfSequence",
	"inProgress",
	"finished",
];

/**
 * Count of patron requests in one bucket. `pagesize: 1` because only
 * `totalSize` is wanted - this is a count, not a page of results.
 *
 * Four of these were declared inline in each of five route files: twenty
 * copies of the same six variables, differing only in which `queries.*` string
 * they passed. `select` unwraps the count so no caller repeats
 * `?.patronRequests?.totalSize ?? 0` either.
 *
 * The key stays under the "patronRequest" prefix so
 * `invalidatePatronRequestQueries` keeps refreshing the tab counts after a
 * status-changing action.
 */
export const patronRequestTotalQuery = (
	gqlClient: GraphQLClient,
	bucket: PatronRequestBucket,
) =>
	queryOptions({
		queryKey: ["patronRequestTotals", bucket],
		queryFn: () =>
			gqlClient.request<any, LoadPatronRequestTotalsQueryVariables>(
				getPatronRequestTotals,
				{
					query: queries[bucket],
					pageno: 0,
					pagesize: 1,
					order: "dateCreated",
					orderBy: "DESC",
				},
			),
		select: (data: any): number => data?.patronRequests?.totalSize ?? 0,
	});
