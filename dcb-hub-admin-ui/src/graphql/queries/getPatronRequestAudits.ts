import { gql } from "graphql-request";

/** A page of one request's history, for its History tab. */
export const getPatronRequestAudits = gql`
	query LoadPatronRequestAudits(
		$query: String!
		$pageno: Int!
		$pagesize: Int!
		$order: String!
		$orderBy: String!
	) {
		audits(
			query: $query
			pageno: $pageno
			pagesize: $pagesize
			order: $order
			orderBy: $orderBy
		) {
			totalSize
			content {
				id
				auditDate
				briefDescription
				fromStatus
				toStatus
			}
		}
	}
`;
