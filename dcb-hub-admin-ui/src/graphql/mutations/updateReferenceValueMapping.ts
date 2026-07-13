import { gql } from "graphql-request";

export const updateReferenceValueMapping = gql`
	mutation UpdateReferenceValueMapping(
		$input: UpdateReferenceValueMappingInput!
	) {
		updateReferenceValueMapping(input: $input) {
			id
			toValue
		}
	}
`;
