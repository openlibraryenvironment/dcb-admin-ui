import { gql } from "graphql-request";

// The caller scopes this to one patron with `query: localId:<pickupPatronId>`, but
// the document never declared or forwarded $query, so the server returned the first
// default page of ALL patron identities rather than the ones for this request.
export const getPatronIdentities = gql`
	query LoadPatronIdentities(
		$query: String!
		$order: String!
		$orderBy: String!
	) {
		patronIdentities(query: $query, order: $order, orderBy: $orderBy) {
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
