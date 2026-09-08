import { gql } from "graphql-request";

export const getClustersTitleOnly = gql`
	query ClusterRecordsTitleOnly($query: String!) {
		instanceClusters(query: $query) {
			content {
				id
				title
				selectedBib
				isDeleted
				dateCreated
				dateUpdated
			}
		}
	}
`;
