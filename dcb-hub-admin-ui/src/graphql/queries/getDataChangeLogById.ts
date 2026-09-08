import { gql } from "graphql-request";

export const getDataChangeLogById = gql`
	query GetDataChangeLogById($query: String!) {
		dataChangeLog(query: $query) {
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
