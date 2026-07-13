import { gql } from "graphql-request";

export const createHostLmsMutation = gql`
	mutation CreateHostLms($input: CreateHostLmsInput!) {
		createHostLms(input: $input) {
			hostLms {
				id
				code
				name
				lmsClientClass
			}
			pingStatus
			ingestStatus
			warnings
		}
	}
`;
