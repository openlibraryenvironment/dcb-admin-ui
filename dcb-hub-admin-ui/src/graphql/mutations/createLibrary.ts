import { gql } from "graphql-request";

export const createLibraryMutation = gql`
	mutation CreateLibrary($input: LibraryInput!) {
		createLibrary(input: $input) {
			id
			agencyCode
			fullName
			shortName
		}
	}
`;
