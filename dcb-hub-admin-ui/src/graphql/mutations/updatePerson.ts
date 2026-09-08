import { gql } from "graphql-request";
export const updatePerson = gql`
	mutation UpdatePerson($input: UpdatePersonInput!) {
		updatePerson(input: $input) {
			id
			email
			firstName
			lastName
			role {
				id
				name
				displayName
			}
			isPrimaryContact
		}
	}
`;
