import { gql } from "graphql-request";

// The whole list, retired tags included: dcb-service caps it at 100 tags, so it is not paged.
export const getRequestTags = gql`
	query LoadRequestTags {
		requestTags {
			code
			label
			description
			active
		}
	}
`;
