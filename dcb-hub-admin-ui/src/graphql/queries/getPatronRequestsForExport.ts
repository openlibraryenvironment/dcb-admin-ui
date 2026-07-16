// A query for getting all info needed for the export of patron requests data.
// Field selection is deliberately identical to the on-screen grids' - see
// patronRequestFields - so an export can never disagree with what the grid shows.

import { gql } from "graphql-request";
import { patronRequestFields } from "@fragments/patronRequestFields";

export const getPatronRequestsForExport = gql`
	${patronRequestFields}
	query LoadPatronRequestsForExport(
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
