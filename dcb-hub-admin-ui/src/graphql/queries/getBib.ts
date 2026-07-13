import { gql } from "graphql-request";
// Gets a bib record by its ID for the individual record page
// But leaves out the sourceRecord to be fetched on-demand ONLY
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
