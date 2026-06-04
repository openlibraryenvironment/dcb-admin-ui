import { gql } from "graphql-request";
export const getLibraryBasicsLocation = gql`
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
					hostLms {
						id
						code
						lmsClientClass
					}
				}
				secondHostLms {
					code
					name
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
