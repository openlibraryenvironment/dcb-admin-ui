import { gql } from "graphql-request";

export const getGroupsSelection = gql`
	query LoadGroupsSelection($order: String!, $orderBy: String!) {
		libraryGroups(order: $order, orderBy: $orderBy) {
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
