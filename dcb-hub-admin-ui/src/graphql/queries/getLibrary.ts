import { gql } from "graphql-request";

import { capabilitySelection } from "@helpers/capabilityFields";

// Library
// This query fetches all information about a Library from DCB.
// The main place this is used is the individual library page.
//
// A FUNCTION, not a constant: the brand fields are absent from UpdateLibraryInput and
// Library before dcb-service 9.0.0, and an undeclared field fails the whole operation.
// See @helpers/capabilityFields for why the flag cannot be read at module scope.
export const getLibrary = () => gql`
	query LoadLibrary($query: String!) {
		libraries(query: $query) {
			content {
				id
				fullName
				shortName
				abbreviatedName
				agencyCode
				supportHours
				address
				latitude
				longitude
				training
				patronWebsite
				discoverySystem
				type
				backupDowntimeSchedule
				hostLmsConfiguration
				principalLabel
				secretLabel
				${capabilitySelection("consortium_branding", "Library")}
				agency {
					id
					code
					name
					authProfile
					isSupplyingAgency
					isBorrowingAgency
					hostLms {
						id
						code
						name
						clientConfig
						lmsClientClass
						itemSuppressionRulesetName
						suppressionRulesetName
					}
				}
				secondHostLms {
					id
					code
					name
					clientConfig
					lmsClientClass
					itemSuppressionRulesetName
					suppressionRulesetName
				}
				membership {
					libraryGroup {
						id
						code
						name
						type
						consortium {
							id
							name
							functionalSettings {
								id
								name
								enabled
							}
						}
					}
				}
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
