import { gql } from "graphql-request";
import { hostLmsProbesSelection } from "@fragments/hostLmsProbes";

export const createHostLmsMutation = () => gql`
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
			${hostLmsProbesSelection()}
			warnings
		}
	}
`;
