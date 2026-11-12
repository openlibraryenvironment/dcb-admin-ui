import { gql } from "graphql-request";

/** The cluster's member bibs and their source records, for a request's Bib tab. */
export const getPatronRequestClusterMembers = gql`
	query LoadPatronRequestClusterMembers($query: String!) {
		patronRequests(query: $query) {
			content {
				id
				clusterRecord {
					id
					members {
						id
						sourceRecordId
						sourceSystemId
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
		}
	}
`;
