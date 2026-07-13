import { gql } from "graphql-request";

export const checkExistingLocations = gql`
	query CheckExistingLocations($pagesize: Int!, $query: String!) {
		locations(pagesize: $pagesize, query: $query) {
			totalSize
		}
	}
`;
