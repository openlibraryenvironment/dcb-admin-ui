import { gql } from "graphql-request";

export const deleteLibraryMutation = gql`
	mutation DeleteLibrary($input: DeleteEntityInput!) {
		deleteLibrary(input: $input) {
			success
			message
		}
	}
`;
