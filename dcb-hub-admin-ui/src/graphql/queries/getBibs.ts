import { gql } from "graphql-request";

export const getBibs = gql`
	query LoadBibs(
		$pageno: Int!
		$pagesize: Int!
		$order: String!
		$query: String!
	) {
		sourceBibs(
			pageno: $pageno
			pagesize: $pagesize
			order: $order
			query: $query
		) {
			totalSize
			content {
				id
				dateCreated
				dateUpdated
				title
				author
				sourceSystemId
				sourceRecordId
				processVersion
				isLargePrint
				contributesTo {
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
