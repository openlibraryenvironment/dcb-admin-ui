import { gql } from "graphql-request";

export const updateConsortiumQuery = gql`
	mutation UpdateConsortium($input: UpdateConsortiumInput!) {
		updateConsortium(input: $input) {
			id
			headerImageUrl
			headerImageUploader
			headerImageUploaderEmail
			aboutImageUrl
			aboutImageUploader
			aboutImageUploaderEmail
			description
			catalogueSearchUrl
			websiteUrl
		}
	}
`;
