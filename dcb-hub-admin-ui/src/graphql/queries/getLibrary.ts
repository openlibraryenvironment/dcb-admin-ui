import { gql } from "graphql-request";

import { capabilitySelection } from "@helpers/capabilityFields";
import { classificationSchemeSelection } from "@fragments/shelfBrowse";

// Library
// This query fetches all information about a Library from DCB.
// The main place this is used is the individual library page.
//
// A FUNCTION, not a constant: window.__APP_ENV__ is assigned after an await in main.tsx,
// so a document built at module scope reads every flag as off for the whole session. Two
// capabilities gate fields here - the 9.0.0 brand columns and V-22.2's classification -
// and an undeclared field fails the whole operation rather than returning null.
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
				${classificationSchemeSelection()}
				discoverySystem
				type
				backupDowntimeSchedule
				targetLoanToBorrowRatio
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
