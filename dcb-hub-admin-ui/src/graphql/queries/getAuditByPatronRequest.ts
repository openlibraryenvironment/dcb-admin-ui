import { gql } from "graphql-request";

export const getAuditsByPatronRequest = gql`
	query GetAuditsByPatronRequest(
		$pageno: Int!
		$pagesize: Int!
		$order: String!
		$query: String!
		$orderBy: String!
	) {
		audits(
			pageno: $pageno
			pagesize: $pagesize
			order: $order
			query: $query
			orderBy: $orderBy
		) {
			totalSize
			content {
				id
				auditDate
				briefDescription
				auditData
				patronRequest {
					id
				}
			}
		}
	}
`;
