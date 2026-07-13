import { gql } from "graphql-request";

// Fetch source record on demand.
export const getBibSourceRecord = gql`
	query LoadBibSourceRecord($query: String!) {
		sourceBibs(query: $query) {
			content {
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
	}
`;
