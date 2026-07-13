import { gql } from "graphql-request";

export const getPatronRequests = gql`
	query LoadPatronRequests(
		$pageno: Int!
		$pagesize: Int!
		$order: String!
		$query: String!
		$orderBy: String!
	) {
		patronRequests(
			pageno: $pageno
			pagesize: $pagesize
			order: $order
			query: $query
			orderBy: $orderBy
		) {
			content {
				id
				dateCreated
				dateUpdated
				patronHostlmsCode
				pickupLocationCode
				description
				status
				previousStatus
				nextExpectedStatus
				errorMessage
				nextScheduledPoll
				outOfSequenceFlag
				elapsedTimeInCurrentStatus
				pollCountForCurrentStatus
				isManuallySelectedItem
				requesterNote
				activeWorkflow
				rawLocalRequestStatus
				rawLocalItemStatus
				localRequestId
				localRequestStatus
				localItemId
				localItemStatus
				localItemType
				patron {
					id
				}
				requestingIdentity {
					id
					localId
					localBarcode
					canonicalPtype
				}
				suppliers {
					localAgency
					canonicalItemType
					localItemBarcode
				}
				clusterRecord {
					id
					title
					members {
						publisher
					}
				}
			}
			pageable {
				number
				offset
			}
			totalSize
		}
	}
`;
