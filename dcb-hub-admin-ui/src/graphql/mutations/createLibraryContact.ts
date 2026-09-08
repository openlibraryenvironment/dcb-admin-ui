import { gql } from "graphql-request";
export const createLibraryContact = gql`
	mutation CreateLibraryContact($input: CreateLibraryContactInput!) {
		createLibraryContact(input: $input) {
			id
			person {
				firstName
				lastName
			}
			library {
				id
			}
		}
	}
`;
