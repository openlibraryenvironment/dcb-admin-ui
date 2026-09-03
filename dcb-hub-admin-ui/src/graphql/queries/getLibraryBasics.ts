import { gql } from "graphql-request";

import { localHoldsSelection } from "@fragments/localHolds";

// A FUNCTION: see @fragments/localHolds.
export const getLibraryBasics = () => gql`
	query LoadLibraryBasics($query: String!) {
		libraries(query: $query) {
			content {
				id
				fullName
				shortName
				agencyCode
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
				agency {
					id
					code
					maxConsortialLoans
					${localHoldsSelection()}
					isSupplyingAgency
					isBorrowingAgency
					hostLms {
						id
						code
						lmsClientClass
					}
				}
				secondHostLms {
					code
					name
					id
					lmsClientClass
				}
			}
		}
	}
`;
