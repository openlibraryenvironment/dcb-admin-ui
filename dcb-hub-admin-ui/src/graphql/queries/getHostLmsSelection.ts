import { gql } from "graphql-request";

// Code, name and client class - the three things needed to attach a library to
// a Host LMS that already exists. Deliberately NOT getHostLms, which pulls the
// full clientConfig (API keys and passwords included) down to every browser
// that opens a picker.
export const getHostLmsSelection = gql`
	query LoadHostLmsSelection($pagesize: Int!) {
		hostLms(query: "", pagesize: $pagesize, order: "code", orderBy: "ASC") {
			totalSize
			content {
				id
				code
				name
				lmsClientClass
			}
		}
	}
`;
