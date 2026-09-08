import { gql } from "graphql-request";

import { consortiumBrandSelection } from "@fragments/consortiumBrand";

/**
 * A FUNCTION, not a constant — see getConsortia for why the flag cannot be read at
 * module scope.
 *
 * This is the query the header runs on EVERY page, so it is the one with the widest
 * blast radius if its selection set outruns the deployment's dcb-service.
 */
export const getConsortiumBasics = () => gql`
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
				# aboutImageUrl, merged into the brand columns by V9_0_004; read from
				# whichever pair this deployment's dcb-service actually has, and
				# normalised by readConsortiumBrand.
				${consortiumBrandSelection("chrome")}
				description
				catalogueSearchUrl
				websiteUrl
			}
		}
	}
`;
