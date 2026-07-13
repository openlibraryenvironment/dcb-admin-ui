import { gql } from "graphql-request";

export const getConsortiumFunctionalSettings = gql`
	query LoadConsortiumFS($order: String!, $orderBy: String!) {
		consortia(order: $order, orderBy: $orderBy) {
			totalSize
			content {
				id
				name
				displayName
				functionalSettings {
					id
					name
					enabled
					description
				}
			}
		}
	}
`;
