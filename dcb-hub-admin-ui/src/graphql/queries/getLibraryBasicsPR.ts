import { gql } from "graphql-request";

export const getLibraryBasicsPR = gql`
	query LoadLibraryServiceInfo($query: String!) {
		libraries(query: $query) {
			content {
				id
				fullName
				agencyCode
				agency {
					id
					authProfile
					hostLms {
						id
						code
						name
					}
				}
			}
		}
	}
`;
