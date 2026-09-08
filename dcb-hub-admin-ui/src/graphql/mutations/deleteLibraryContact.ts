import { gql } from "graphql-request";

export const deleteLibraryContact = gql`
	mutation DeleteLibraryContact($input: DeleteLibraryContactInput!) {
		deleteLibraryContact(input: $input) {
			success
			message
		}
	}
`;
