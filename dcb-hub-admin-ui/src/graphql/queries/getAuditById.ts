import { gql } from "graphql-request";

export const getAuditById = gql`
	query GetAuditById($query: String!) {
		audits(query: $query) {
			content {
				id
				auditDate
				briefDescription
				fromStatus
				toStatus
				auditData
				patronRequest {
					id
				}
			}
		}
	}
`;
