import { gql } from "graphql-request";

export const getLocationForPatronRequestGrid = gql`
	query LoadLocationForPRGrid(
		$pageno: Int!
		$pagesize: Int!
		$order: String!
		$query: String!
		$orderBy: String!
	) {
		locations(
			pageno: $pageno
			pagesize: $pagesize
			order: $order
			query: $query
			orderBy: $orderBy
		) {
			content {
				id
				code
				name
				# Maps a pickup location to its library, which PatronRequest itself
				# cannot express - it only carries a pickup location id.
				agency {
					code
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
