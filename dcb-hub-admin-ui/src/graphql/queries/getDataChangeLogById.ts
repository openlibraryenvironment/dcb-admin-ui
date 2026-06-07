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
				reason
				changeReferenceUrl
		) {
			totalSize
			content {
				id
				code
				created
				lastSeen
				repeatCount
				expires
				alarmDetails
			}
			pageable {
				number
				offset
			}
		}
	}
`;
