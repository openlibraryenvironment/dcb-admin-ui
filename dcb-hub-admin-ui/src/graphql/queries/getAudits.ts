import { gql } from "graphql-request";

export const getAudits = gql`
	query LoadAudits(
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
				fromStatus
				toStatus
				patronRequest {
					id
				}
			}
		}
	}
`;
