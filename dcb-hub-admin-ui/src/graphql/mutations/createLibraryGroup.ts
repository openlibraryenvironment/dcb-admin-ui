import { gql } from "graphql-request";
export const createLibraryGroup = gql`
	mutation CreateLibraryGroup($input: LibraryGroupInput!) {
		createLibraryGroup(input: $input) {
			id
			code
			name
			type
		}
	}
`;
