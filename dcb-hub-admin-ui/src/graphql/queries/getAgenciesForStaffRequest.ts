import { gql } from "graphql-request";

export const getAgenciesForStaffRequest = gql`
	query LoadAgenciesForStaffRequest(
		$pageno: Int!
		$pagesize: Int!
		$order: String!
		$query: String!
		$orderBy: String!
	) {
		agencies(
			pageno: $pageno
			pagesize: $pagesize
			order: $order
			query: $query
			orderBy: $orderBy
		) {
			totalSize
			content {
				id
				code
				name
				hostLms {
					id
					code
				}
			}
			pageable {
				number
				offset
			}
		}
	}
`;
