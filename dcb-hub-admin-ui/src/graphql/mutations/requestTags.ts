import { gql } from "graphql-request";

// Updating replaces only what the input names: an omitted `active` or `description` keeps
// its stored value, and `description: null` clears it.
export const createRequestTag = gql`
	mutation CreateRequestTag($input: RequestTagInput!) {
		createRequestTag(input: $input) {
			code
			label
			description
			active
		}
	}
`;

export const updateRequestTag = gql`
	mutation UpdateRequestTag($input: RequestTagInput!) {
		updateRequestTag(input: $input) {
			code
			label
			description
			active
		}
	}
`;

// Refused while any request carries the tag; the tag can then only be retired.
export const deleteRequestTag = gql`
	mutation DeleteRequestTag($code: String!) {
		deleteRequestTag(code: $code) {
			success
			message
		}
	}
`;
