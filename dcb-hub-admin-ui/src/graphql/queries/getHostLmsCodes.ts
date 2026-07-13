import { gql } from "graphql-request";

// Just the codes. The consortium-wide "new mapping" form needs the set of
// contexts a mapping can be between (DCB, or any Host LMS) - it has no library
// to derive a single code from. Deliberately NOT getHostLms, which drags down a
// clientConfig JSON blob per row that this has no use for.
export const getHostLmsCodes = gql`
	query LoadHostLmsCodes($query: String!, $pagesize: Int!) {
		hostLms(query: $query, pagesize: $pagesize, order: "code", orderBy: "ASC") {
			content {
				id
				code
			}
		}
	}
`;
