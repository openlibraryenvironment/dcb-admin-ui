import { gql } from "graphql-request";

// Server-side aggregation for the Audit Explorer incidence chart. Postgres does the
// GROUP BY, so this returns a handful of buckets rather than a page of timestamps, and
// covers the WHOLE matching set instead of the most recent N events.
//
// `query` carries the same Lucene string the grid below the chart is filtering on, and the
// backend puts it through the identical query -> predicate translation, so the two cannot
// disagree.
export const getAuditIncidence = gql`
	query LoadAuditIncidence(
		$query: String
		$interval: String
		$start: String
		$end: String
	) {
		auditIncidence(
			query: $query
			interval: $interval
			start: $start
			end: $end
		) {
			interval
			totalSize
			buckets {
				bucketStart
				count
			}
		}
	}
`;
