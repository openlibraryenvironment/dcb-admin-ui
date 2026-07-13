import { gql } from "graphql-request";

export const getPatronRequest = gql`
	query LoadPatronRequest($query: String!) {
		patronRequests(query: $query) {
			content {
				id
				dateUpdated
				patronHostlmsCode
				bibClusterId
				pickupLocationCode
				pickupPatronId
				pickupItemId
				pickupItemType
				pickupItemStatus
				pickupRequestId
				pickupRequestStatus
				pickupBibId
				rawPickupItemStatus
				rawPickupRequestStatus
				status
				localRequestId
				localRequestStatus
				localItemId
				localItemStatus
				localItemType
				isExpeditedCheckout
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
				patron {
					id
				}
				requestingIdentity {
					id
					localId
					homeIdentity
					localBarcode
					localNames
					localPtype
					canonicalPtype
					localHomeLibraryCode
					lastValidated
				}
				audit {
					id
					auditDate
					briefDescription
					fromStatus
					toStatus
					auditData
				}
				clusterRecord {
					id
					title
					selectedBib
					isDeleted
					dateCreated
					dateUpdated
					members {
						id
						dateCreated
						dateUpdated
						title
						author
						placeOfPublication
						publisher
						dateOfPublication
						edition
						isLargePrint
						clusterReason
						typeOfRecord
						canonicalMetadata
						metadataScore
						processVersion
						sourceSystemId
						sourceRecordId
						sourceRecord {
							id
							hostLmsId
							remoteId
							lastFetched
							lastProcessed
							processingState
							processingInformation
							sourceRecordData
						}
					}
				}
				dateCreated
				activeWorkflow
				requesterNote
				suppliers {
					id
					canonicalItemType
					dateCreated
					dateUpdated
					hostLmsCode
					isActive
					localItemId
					localBibId
					localItemBarcode
					localItemLocationCode
					localItemStatus
					localItemType
					localId
					localRenewalCount
					localStatus
					localAgency
					rawLocalItemStatus
					rawLocalStatus
					virtualPatron {
						id
						localId
						homeIdentity
						localBarcode
						localNames
						localPtype
						canonicalPtype
						localHomeLibraryCode
						lastValidated
					}
				}
			}
		}
	}
`;
