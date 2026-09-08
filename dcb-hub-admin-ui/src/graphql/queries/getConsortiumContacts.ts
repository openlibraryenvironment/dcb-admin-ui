import { gql } from "graphql-request";

export const getConsortiumContacts = gql`
	query LoadConsortiumContacts($order: String!, $orderBy: String!) {
		consortia(order: $order, orderBy: $orderBy) {
			totalSize
			content {
				id
				name
				displayName
				contacts {
					id
					firstName
					lastName
					role {
						id
						name
						description
						displayName
						keycloakRole
					}
					isPrimaryContact
					email
				}
			}
		}
	}
`;
