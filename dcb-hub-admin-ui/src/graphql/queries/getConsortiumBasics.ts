import { gql } from "graphql-request";

export const getConsortiumBasics = gql`
	query LoadConsortiumHeader($order: String!, $orderBy: String!) {
		consortia(order: $order, orderBy: $orderBy) {
			totalSize
			content {
				id
				name
				# Every library belongs to the consortium's own group, so the new
				# library wizard needs its id to add them to it automatically.
				#
				# The id and NOTHING ELSE. getConsortiaDataFetcher runs a plain
				# findAll with no join on this association, so Micronaut Data
				# populates only the foreign key - name, code and type come back
				# null. They are String! in the schema, so asking for one of them
				# fails the whole consortia field, and because libraryGroup is
				# itself LibraryGroup! the null propagates up and wipes the whole
				# response. That took the header, the consortium check and
				# everything built on them down together. The group name is
				# looked up from the groups list where it is needed.
				libraryGroup {
					id
				}
				displayName
				# The app bar mark and the landing card mark. Formerly headerImageUrl and
				# aboutImageUrl, merged into the brand columns by V9_0_004.
				brandHeaderIconUrl
				brandLogoUrl
				description
				catalogueSearchUrl
				websiteUrl
			}
		}
	}
`;
