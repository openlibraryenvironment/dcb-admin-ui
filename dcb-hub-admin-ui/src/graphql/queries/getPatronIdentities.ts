import { gql } from "graphql-request";

export const getPatronIdentities = gql`
	query LoadPatronIdentities($order: String!, $orderBy: String!) {
		patronIdentities(order: $order, orderBy: $orderBy) {
			totalSize
			content {
				id
				localId
				homeIdentity
				localBarcode
				localNames
				localPtype
				canonicalPtype
				localHomeLibraryCode
				lastValidated
			}
		}
	}
`;
