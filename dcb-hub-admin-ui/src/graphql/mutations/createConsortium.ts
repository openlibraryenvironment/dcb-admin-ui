import { gql } from "graphql-request";

export const createConsortiumMutation = gql`
	mutation CreateConsortium($input: ConsortiumInput!) {
		createConsortium(input: $input) {
			id
			name
			displayName
			dateOfLaunch
			libraryGroup {
				id
				name
			}
		}
	}
`;
