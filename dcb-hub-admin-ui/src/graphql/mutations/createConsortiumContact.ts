import { gql } from "graphql-request";

export const createConsortiumContact = gql`
	mutation CreateConsortiumContact($input: ConsortiumContactInput!) {
		createContact(input: $input) {
			id
			person {
				firstName
				lastName
			}
			consortium {
				id
			}
		}
	}
`;
