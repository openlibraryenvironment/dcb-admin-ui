import { gql } from "graphql-request";

export const addFunctionalSettingQuery = gql`
	mutation AddFunctionalSetting($input: FunctionalSettingInput!) {
		createFunctionalSetting(input: $input) {
			id
			name
			enabled
			description
		}
	}
`;
