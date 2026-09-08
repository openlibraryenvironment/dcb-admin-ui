import { gql } from "graphql-request";

export const getLibraryGroupById = gql`
	query LoadGroup($query: String!) {
		libraryGroups(query: $query) {
			content {
				id
				code
				name
				type
				consortium {
					id
					name
				}
				members {
					id
					library {
						id
						agencyCode
						agency {
							authProfile
							code
							id
							isBorrowingAgency
							isSupplyingAgency
							hostLms {
								lmsClientClass
								code
								id
							}
						}
						shortName
						fullName
						abbreviatedName
						longitude
						latitude
					}
				}
			}
		}
	}
`;
