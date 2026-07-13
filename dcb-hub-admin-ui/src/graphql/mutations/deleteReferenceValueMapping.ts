import { gql } from "graphql-request";

export const deleteReferenceValueMapping = gql`
	mutation DeleteReferenceValueMapping($input: DeleteEntityInput!) {
		deleteReferenceValueMapping(input: $input) {
			success
			message
		}
	}
`;
