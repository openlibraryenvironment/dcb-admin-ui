import { gql } from "graphql-request";

export const getConsortiumBasics = gql`
	query LoadConsortiumHeader($order: String!, $orderBy: String!) {
		consortia(order: $order, orderBy: $orderBy) {
			totalSize
			content {
				id
				name
				displayName
				headerImageUrl
				aboutImageUrl
				description
				catalogueSearchUrl
				websiteUrl
			}
		}
	}
`;
