import { gql } from "graphql-request";

// A query for getting reference value mappings.

export const getMappings = gql`
	query LoadMappings(
		$pageno: Int!
		$pagesize: Int!
		$order: String!
		$query: String!
		$orderBy: String!
	) {
		referenceValueMappings(
			pageno: $pageno
			pagesize: $pagesize
			order: $order
			query: $query
			orderBy: $orderBy
		) {
			totalSize
			content {
				id
				fromCategory
				fromContext
				fromValue
				toCategory
				toContext
				toValue
				reciprocal
				label
				lastImported
				deleted
			}
			pageable {
				number
				offset
			}
		}
	}
`;
