import { gql } from "graphql-request";

export const createLibraryMutation = gql`
	mutation CreateLibrary($input: CreateLibraryInput!) {
		createLibrary(input: $input) {
			id
			agencyCode
			fullName
			shortName
		}
	}
`;
