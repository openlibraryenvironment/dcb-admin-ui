import { gql } from "graphql-request";
export const addLibraryToGroup = gql`
	mutation addLibraryToGroup($input: AddLibraryToGroupCommand!) {
		addLibraryToGroup(input: $input) {
			id
			library {
				id
				agencyCode
				fullName
			}
			libraryGroup {
				id
				code
				name
				type
			}
		}
	}
`;
