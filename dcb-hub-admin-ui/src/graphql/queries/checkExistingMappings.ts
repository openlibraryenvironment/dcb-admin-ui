import { gql } from "graphql-request";

export const checkExistingMappings = gql`
	query CheckExistingMappings($pagesize: Int!, $query: String!) {
		referenceValueMappings(pagesize: $pagesize, query: $query) {
			totalSize
			content {
				id
				fromCategory
				fromContext
				fromValue
				toCategory
				toContext
				toValue
				reciprocal
				label
				lastImported
				deleted
			}
		}
	}
`;
