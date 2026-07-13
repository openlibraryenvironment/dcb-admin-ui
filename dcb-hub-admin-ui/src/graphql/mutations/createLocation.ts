import { gql } from "graphql-request";

export const createLocation = gql`
	mutation CreateLocation($input: CreateLocationInput!) {
		createLocation(input: $input) {
			id
			name
		}
	}
`;
