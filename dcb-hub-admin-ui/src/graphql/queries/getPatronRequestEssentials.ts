// A streamlined query for only getting the most essential information for a patron request.

import { gql } from "graphql-request";

// Used when we need to check essential info like status etc.
export const getPatronRequestEssentials = gql`
	query LoadPatronRequestsById($query: String!) {
		patronRequests(query: $query) {
			content {
				id
				dateUpdated
				patronHostlmsCode
				bibClusterId
				status
				localRequestId
				localRequestStatus
				localItemId
				localItemStatus
				localItemType
				localBibId
				rawLocalItemStatus
				rawLocalRequestStatus
				description
				nextScheduledPoll
				errorMessage
				previousStatus
				pollCountForCurrentStatus
				currentStatusTimestamp
				nextExpectedStatus
				outOfSequenceFlag
				elapsedTimeInCurrentStatus
				localItemHostlmsCode
				localItemAgencyCode
				isManuallySelectedItem
				resolutionCount
				renewalCount
				renewalStatus
				localRenewalCount
				dateCreated
				activeWorkflow
				requesterNote
			}
		}
	}
`;
