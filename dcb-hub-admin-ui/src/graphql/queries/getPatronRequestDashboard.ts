import { gql } from "graphql-request";
export const getPatronRequestDashboard = gql`
	query GetPatronRequestDashboard(
		$allQuery: String
		$activeQuery: String
		$exceptionQuery: String
		$outOfSequenceQuery: String
		$finishedQuery: String
		$pageno: Int
		$pagesize: Int
		$order: String
		$orderBy: String
	) {
		allRequests: patronRequests(
			query: $allQuery
			pageno: $pageno
			pagesize: $pagesize
			order: $order
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
			totalSize
		}
		activeRequests: patronRequests(
			query: $activeQuery
			pageno: 0
			pagesize: 1
		) {
			totalSize
		}
		exceptionRequests: patronRequests(
			query: $exceptionQuery
			pageno: 0
			pagesize: 1
		) {
			totalSize
		}
		outOfSequenceRequests: patronRequests(
			query: $outOfSequenceQuery
			pageno: 0
			pagesize: 1
		) {
			totalSize
		}
		finishedRequests: patronRequests(
			query: $finishedQuery
			pageno: 0
			pagesize: 1
		) {
			totalSize
		}
	}
`;
