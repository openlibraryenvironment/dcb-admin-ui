import { gql } from "graphql-request";

export const getNumericRangeMappings = gql`
	query LoadNumericRangeMappings(
		$pageno: Int!
		$pagesize: Int!
		$order: String!
		$orderBy: String!
		$query: String!
	) {
		numericRangeMappings(
			pageno: $pageno
			pagesize: $pagesize
			order: $order
			query: $query
			orderBy: $orderBy
		) {
			totalSize
			content {
				id
				context
				domain
				lowerBound
				upperBound
				targetContext
				mappedValue
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
