import { gql } from "graphql-request";

export const getRoles = gql`
	query LoadRoles($order: String!, $orderBy: String!, $pagesize: Int!) {
		roles(order: $order, orderBy: $orderBy, pagesize: $pagesize) {
			totalSize
			content {
				id
				name
				keycloakRole
				description
				displayName
			}
		}
	}
`;
