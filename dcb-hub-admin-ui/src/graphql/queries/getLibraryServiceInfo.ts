import { gql } from "graphql-request";

export const getLibraryServiceInfo = gql`
	query LoadLibraryServiceInfo($query: String!) {
		libraries(query: $query) {
			content {
				id
				fullName
				patronWebsite
				discoverySystem
				backupDowntimeSchedule
				hostLmsConfiguration
				agency {
					id
					authProfile
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
			}
		}
	}
`;
