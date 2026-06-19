import { gql } from "graphql-request";

export const addFunctionalSettingMutation = gql`
	mutation AddFunctionalSetting($input: FunctionalSettingInput!) {
		createFunctionalSetting(input: $input) {
			id
			name
			enabled
			description
		}
	}
`;
