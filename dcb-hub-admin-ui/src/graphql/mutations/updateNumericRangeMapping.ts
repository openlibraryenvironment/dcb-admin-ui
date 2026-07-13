import { gql } from "graphql-request";
export const updateNumericRangeMapping = gql`
	mutation UpdateNumericRangeMapping($input: UpdateNumericRangeMappingInput!) {
		updateNumericRangeMapping(input: $input) {
			id
			mappedValue
		}
	}
`;
