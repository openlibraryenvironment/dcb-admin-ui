import { gql } from "graphql-request";

export const deleteConsortiumContact = gql`
	mutation DeleteConsortiumContact($input: DeleteConsortiumContactInput!) {
		deleteContact(input: $input) {
			success
			message
		}
	}
`;
