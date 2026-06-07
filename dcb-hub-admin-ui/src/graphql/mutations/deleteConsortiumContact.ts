import { gql } from "graphql-request";

export const deleteConsortiumContact = gql`
	mutation DeleteLibraryContact($input: DeleteConsortiumContactInput!) {
		deleteContact(input: $input) {
			success
			message
		}
	}
`;
