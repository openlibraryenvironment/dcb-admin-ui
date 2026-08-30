import { gql } from "graphql-request";

/**
 * How many libraries exist, and nothing else — W-5.
 *
 * Setup only needs to know whether the number is zero, and `LoadLibraries` costs a full
 * page of libraries with their agencies, host LMS, contacts and group memberships to
 * answer it. At 500 members that is a large payload assembled so the progress rail can
 * decide whether to show a tick.
 *
 * `pagesize: 1` because `totalSize` is the whole answer: the one row that comes back is
 * discarded, and asking for zero rows is not something the pageable contract promises.
 */
export const getLibraryCount = gql`
	query LoadLibraryCount(
		$pageno: Int!
		$pagesize: Int!
		$order: String!
		$query: String!
		$orderBy: String!
	) {
		libraries(
			pageno: $pageno
			pagesize: $pagesize
			order: $order
			query: $query
			orderBy: $orderBy
		) {
			totalSize
		}
	}
`;
