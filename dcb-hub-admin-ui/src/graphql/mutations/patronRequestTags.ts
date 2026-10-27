import { gql } from "graphql-request";

// No agencyCode: consortium staff apply and remove only the consortium's own application of a
// tag, whichever libraries have also applied it
export const tagPatronRequest = gql`
	mutation TagPatronRequest($patronRequestId: ID!, $tagCode: String!) {
		tagPatronRequest(patronRequestId: $patronRequestId, tagCode: $tagCode) {
			code
		}
	}
`;

export const untagPatronRequest = gql`
	mutation UntagPatronRequest($patronRequestId: ID!, $tagCode: String!) {
		untagPatronRequest(patronRequestId: $patronRequestId, tagCode: $tagCode) {
			code
		}
	}
`;
