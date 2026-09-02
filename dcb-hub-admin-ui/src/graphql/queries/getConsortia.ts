import { gql } from "graphql-request";

import { consortiumBrandSelection } from "@fragments/consortiumBrand";

/**
 * A FUNCTION, not a constant — R-19.
 *
 * The brand selection depends on a runtime feature flag, and the flag is read from
 * window.__APP_ENV__, which application.tsx assigns only AFTER awaiting
 * inject_env.json. This module is in the static import graph and evaluates long
 * before that, so a constant built at module scope would read the flag as undefined
 * and every environment would silently run in legacy mode. Building the document when
 * the query actually runs is what makes the flag work at all.
 */
export const getConsortia = () => gql`
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
				# headerImageUrl/aboutImageUrl and their uploader fields in V9_0_004:
				# the uploader pair was a member of staff's name and email address on a
				# type any authenticated principal could read, and asking for it here
				# put it in every administrator's browser besides. Before 9.0.0 the two
				# marks are read from the pre-migration columns and the uploader fields
				# are still not asked for.
				${consortiumBrandSelection("full")}
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
