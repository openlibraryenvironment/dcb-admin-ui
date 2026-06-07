import { gql } from "graphql-request";

export const getConsortia = gql`
	query LoadConsortium($order: String!, $orderBy: String!) {
		consortia(order: $order, orderBy: $orderBy) {
			totalSize
			content {
				id
				name
				libraryGroup {
					id
				}
				dateOfLaunch
				headerImageUrl
				headerImageUploader
				headerImageUploaderEmail
				aboutImageUrl
				aboutImageUploader
				aboutImageUploaderEmail
				description
				catalogueSearchUrl
				websiteUrl
				displayName
				contacts {
					email
					id
				}
				functionalSettings {
					id
					name
					enabled
				}
			}
		}
	}
`;
