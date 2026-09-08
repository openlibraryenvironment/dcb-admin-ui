import { gql } from "graphql-request";

export const getLibraryGroups = gql`
	query LoadGroups(
		$pageno: Int!
		$pagesize: Int!
		$order: String!
		$query: String!
		$orderBy: String!
	) {
		libraryGroups(
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
				type
				consortium {
					name
					id
				}
			}
			pageable {
				number
				offset
			}
		}
	}
`;
