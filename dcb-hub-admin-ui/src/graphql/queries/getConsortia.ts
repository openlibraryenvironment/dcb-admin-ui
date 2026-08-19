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
				description
				catalogueSearchUrl
				websiteUrl
				displayName
				# The brand (N-1B), one set of marks for every DCB app. These replaced
				# headerImageUrl/aboutImageUrl and their uploader fields in V8_74_002:
				# the uploader pair was a member of staff's name and email address on a
				# type any authenticated principal could read, and asking for it here
				# put it in every administrator's browser besides.
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
