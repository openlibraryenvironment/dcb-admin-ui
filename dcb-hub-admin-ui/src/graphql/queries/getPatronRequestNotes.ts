import { gql } from "graphql-request";

// Newest first; dcb-service serves at most 50 a page and 200 a request
export const getPatronRequestNotes = gql`
	query LoadPatronRequestNotes($query: String!, $pageno: Int, $pagesize: Int) {
		patronRequests(query: $query) {
			content {
				id
				notes(pageno: $pageno, pagesize: $pagesize) {
					totalSize
					content {
						id
						authorKind
						agencyCode
						libraryName
						body
						dateCreated
						retracted
						retractedBy
					}
				}
			}
		}
	}
`;
