import { gql } from "graphql-request";

export const getPatronRequestTags = gql`
	query LoadPatronRequestTags($query: String!) {
		patronRequests(query: $query) {
			content {
				id
				tags {
					code
					label
					agencyCodes
					consortium
				}
			}
		}
	}
`;
