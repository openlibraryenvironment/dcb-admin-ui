import { gql } from "graphql-request";

export const updateConsortiumQuery = gql`
	mutation UpdateConsortium($input: UpdateConsortiumInput!) {
		updateConsortium(input: $input) {
			id
			description
			catalogueSearchUrl
			websiteUrl
			brandLogoUrl
			brandLogoAlt
			brandHeaderIconUrl
			brandBackgroundImageUrl
			patronWelcome
			defaultThemeName
		}
	}
`;
