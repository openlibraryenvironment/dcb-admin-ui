import { gql } from "graphql-request";

export const getPatronRequestTotals = gql`
	query LoadPatronRequestTotals(
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
				status
				patronHostlmsCode
				isExpeditedCheckout
				outOfSequenceFlag
			}
			pageable {
				number
				offset
			}
			totalSize
		}
	}
`;
