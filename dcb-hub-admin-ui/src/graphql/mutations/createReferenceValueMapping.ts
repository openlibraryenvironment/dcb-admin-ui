import { gql } from "graphql-request";

export const createReferenceValueMapping = gql`
	mutation CreateReferenceValueMapping(
		$input: CreateReferenceValueMappingInput!
	) {
		createReferenceValueMapping(input: $input) {
			id
			toValue
		}
	}
`;
