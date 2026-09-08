import { gql } from "graphql-request";

export const getClusters = gql`
	query ClusterRecords($query: String!) {
		instanceClusters(query: $query) {
			content {
				id
				title
				selectedBib
				isDeleted
				dateCreated
				dateUpdated
				lastIndexed
				members {
					id
					title
					author
					typeOfRecord
					canonicalMetadata
					clusterReason
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
					matchPoints {
						id
						value
					}
				}
			}
		}
	}
`;
