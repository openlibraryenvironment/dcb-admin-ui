import { gql } from "graphql-request";

export const updateFunctionalSettingQuery = gql`
	mutation UpdateFunctionalSetting($input: UpdateFunctionalSettingInput!) {
		updateFunctionalSetting(input: $input) {
			id
			name
			enabled
			description
		}
	}
`;
