import { gql } from "graphql-request";

export const getAgencies = gql`
	query LoadAgencies(
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
				latitude
				longitude
			}
			pageable {
				number
				offset
			}
		}
	}
`;
