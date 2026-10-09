import { gql } from "graphql-request";

/**
 * Codes to a library, and nothing else.
 *
 * Deliberately NOT getLibraries: that projection carries `clientConfig`, a JSON scalar
 * that cannot be sub-selected, twice per library. docs/query-error-policy.md,
 * "Resolving a code to a library".
 */
export const getLibraryDirectory = gql`
	query LoadLibraryDirectory(
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
			content {
				id
				fullName
				agencyCode
				agency {
					code
					hostLms {
						code
					}
				}
				# A library may run a second Host LMS, and a patron's home code can be
				# either of them.
				secondHostLms {
					code
				}
			}
			totalSize
		}
	}
`;
