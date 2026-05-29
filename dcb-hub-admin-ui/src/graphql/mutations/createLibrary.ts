import { gql } from "graphql-request";
export const createLibrary = gql`
	mutation CreateLibrary($input: LibraryInput!) {
		createLibrary(input: $input) {
			id
			fullName
			type
		}
	}
`;
