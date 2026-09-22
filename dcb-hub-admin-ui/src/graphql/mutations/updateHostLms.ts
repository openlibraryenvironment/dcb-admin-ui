import { gql } from "graphql-request";

/**
 * `clientConfig` is deliberately NOT in the selection set, although the input writes it.
 *
 * Nothing renders from the mutation result - the page re-reads LoadHostLms after
 * invalidation - so selecting it would put a second copy of every API key and secret in
 * a second cache entry for no gain.
 *
 * `pingStatus` and `ingestStatus` ARE selected: dcb-service re-probes the system on an
 * update exactly as it does on a create, and a credential change that leaves the Host
 * LMS unreachable has to be visible at the moment it is made rather than at the next
 * ingest run.
 */
export const updateHostLmsMutation = gql`
	mutation UpdateHostLms($input: UpdateHostLmsInput!) {
		updateHostLms(input: $input) {
			hostLms {
				id
				code
				name
				lmsClientClass
				suppressionRulesetName
				itemSuppressionRulesetName
			}
			pingStatus
			ingestStatus
			warnings
		}
	}
`;
