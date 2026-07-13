import { gql } from "graphql-request";

export const getClusterIdsByTitle = gql`
	query LoadClusterIdsByTitle($query: String!, $pagesize: Int, $pageno: Int) {
		sourceBibs(query: $query, pagesize: $pagesize, pageno: $pageno) {
			content {
				contributesTo {
					id
				}
			}
		}
	}
`;
