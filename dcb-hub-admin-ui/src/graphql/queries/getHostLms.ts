import { gql } from "graphql-request";

export const getHostLms = gql`
	query LoadHostLms($query: String!) {
		hostLms(query: $query) {
			content {
				id
				code
				name
				lmsClientClass
				clientConfig
				itemSuppressionRulesetName
				suppressionRulesetName
			}
		}
	}
`;
