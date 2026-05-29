import { gql } from "graphql-request";

export const getLibraryBibClusterIds = gql`
	query LoadLibraryBibClusterIds(
		$query: String!
		$pagesize: Int
		$pageno: Int
	) {
		patronRequests(query: $query, pagesize: $pagesize, pageno: $pageno) {
			content {
				bibClusterId
				clusterRecord {
					title
					members {
						publisher
					}
				}
			}
		}
	}
`;
