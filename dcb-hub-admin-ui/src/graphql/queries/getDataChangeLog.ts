import { gql } from "graphql-request";

export const getDataChangeLog = gql`
	query LoadDataChangeLog(
		$pageno: Int!
		$pagesize: Int!
		$order: String!
		$query: String!
		$orderBy: String!
	) {
		dataChangeLog(
			pageno: $pageno
			pagesize: $pagesize
			order: $order
			query: $query
			orderBy: $orderBy
		) {
			totalSize
			content {
				id
				entityId
				entityType
				actionInfo
				lastEditedBy
				timestampLogged
				reason
				changeReferenceUrl
				changeCategory
				changes
			}
			pageable {
				number
				offset
			}
		}
	}
`;
