import { gql } from "graphql-request";
export const getLibraryBasicsLocation = gql`
	query LoadLibraryBasicsLocation($query: String!) {
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
					hostLms {
						id
						code
						lmsClientClass
					}
				}
				secondHostLms {
					id
					code
					name
					lmsClientClass
				}
			}
		}
	}
`;
