import { gql } from "graphql-request";

export const getBibClusterIdsByPublisher = gql`
	query LoadBibs($query: String!, $pagesize: Int, $pageno: Int) {
		sourceBibs(query: $query, pagesize: $pagesize, pageno: $pageno) {
			content {
				contributesTo {
					id
				}
			}
		}
	}
`;
