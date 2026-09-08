import { gql } from "graphql-request";

// Both callers pass `pagesize: 1000` to pull every group into a dropdown, but this
// document never declared or forwarded pageno/pagesize, so the server fell back to
// its default page size and the group selector was silently truncated.
export const getGroupsSelection = gql`
	query LoadGroupsSelection(
		$order: String!
		$orderBy: String!
		$pageno: Int
		$pagesize: Int
	) {
		libraryGroups(
			order: $order
			orderBy: $orderBy
			pageno: $pageno
			pagesize: $pagesize
		) {
			totalSize
			content {
				id
				code
				name
				type
			}
		}
	}
`;
