import { gql } from "graphql-request";

export const deleteLibrary = gql`
	mutation DeleteLibrary($input: DeleteEntityInput!) {
		deleteLibrary(input: $input) {
			success
			message
		}
	}
`;
