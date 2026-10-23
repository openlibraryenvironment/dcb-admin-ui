import { gql } from "graphql-request";

// The library table has no creation date; its change-log INSERT row is the record of it
export const getLibraryCreations = gql`
	query LoadLibraryCreations($query: String!, $pagesize: Int!) {
		dataChangeLog(
			query: $query
			pageno: 0
			pagesize: $pagesize
			order: "timestampLogged"
			orderBy: "ASC"
		) {
			content {
				entityId
				timestampLogged
			}
		}
	}
`;
