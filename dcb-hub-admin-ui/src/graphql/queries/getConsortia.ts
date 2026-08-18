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
				# Patron-facing brand (N-1B). Distinct from headerImageUrl/aboutImageUrl
				# above, which are 36x36 and 48x48 admin-chrome icons rather than a mark
				# a patron sees on the discovery app.
				brandLogoUrl
				brandLogoAlt
				brandHeaderIconUrl
				brandBackgroundImageUrl
				patronWelcome
				defaultThemeName
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
