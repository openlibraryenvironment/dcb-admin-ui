import { gql } from "graphql-request";

export const getBibMainDetails = gql`
	query LoadBibMainDetails($query: String!) {
		sourceBibs(query: $query) {
			content {
				id
				dateCreated
				dateUpdated
				title
				author
				canonicalMetadata
				processVersion
				metadataScore
				processVersion
				placeOfPublication
				publisher
				dateOfPublication
				edition
				isLargePrint
				clusterReason
				typeOfRecord
				metadataScore
				contributesTo {
					id
					title
				}
				sourceSystemId
				sourceRecordId
				matchPoints {
					id
					bibId
					value
				}
			}
		}
	}
`;
