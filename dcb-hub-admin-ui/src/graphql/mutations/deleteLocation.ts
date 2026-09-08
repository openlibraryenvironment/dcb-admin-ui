import { gql } from "graphql-request";
export const deleteLocationQuery = gql`
	mutation DeleteLocation($input: DeleteEntityInput!) {
		deleteLocation(input: $input) {
			success
			message
		}
	}
`;
