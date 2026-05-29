import { gql } from "graphql-request";
export const deleteNumericRangeMapping = gql`
	mutation DeleteNumericRangeMapping($input: DeleteEntityInput!) {
		deleteNumericRangeMapping(input: $input) {
			success
			message
		}
	}
`;
