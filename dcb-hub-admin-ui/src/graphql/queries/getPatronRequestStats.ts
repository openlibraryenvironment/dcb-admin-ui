import { gql } from "graphql-request";

export const getPatronRequestStats = gql`
	query LoadPatronRequestStats(
		$pageno: Int!
		$pagesize: Int!
		$order: String!
		$query: String!
		$orderBy: String!
	) {
		patronRequests(
			pageno: $pageno
			pagesize: $pagesize
			order: $order
			query: $query
			orderBy: $orderBy
		) {
			content {
				id
				dateCreated
				dateUpdated
				patronHostlmsCode
				suppliers {
					localAgency
					canonicalItemType
				}
			}
			pageable {
				number
				offset
			}
			totalSize
		}
	}
`;
