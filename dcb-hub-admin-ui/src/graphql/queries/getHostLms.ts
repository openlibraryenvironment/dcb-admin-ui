import { gql } from "graphql-request";

import { capabilitySelection } from "@helpers/capabilityFields";

// The schema's hostLms field accepts pageno/pagesize/order/orderBy, but this
// document never declared or forwarded them. Callers were passing them anyway, so
// the Host LMS grid's server-side pagination and sorting were silently no-ops and
// `totalSize` (its row count) was never even selected. They are optional here
// because several callers legitimately fetch a single record by `query` alone.
// A function: the flag that adds lastPing is not set until after module load
export const getHostLms = (): string => gql`
	query LoadHostLms(
		$query: String!
		$pageno: Int
		$pagesize: Int
		$order: String
		$orderBy: String
	) {
		hostLms(
			query: $query
			pageno: $pageno
			pagesize: $pagesize
			order: $order
			orderBy: $orderBy
		) {
			totalSize
			content {
				id
				code
				name
				lmsClientClass
				clientConfig
				itemSuppressionRulesetName
				suppressionRulesetName
				${capabilitySelection("host_lms_probes", "HostLms")}
			}
		}
	}
`;
