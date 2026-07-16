import { gql } from "graphql-request";
import { patronRequestFields } from "@fragments/patronRequestFields";

export const getPatronRequests = gql`
	${patronRequestFields}
	query LoadPatronRequests(
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
				...PatronRequestFields
			}
			pageable {
				number
				offset
			}
			totalSize
		}
	}
`;
