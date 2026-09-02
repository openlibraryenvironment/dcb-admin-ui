import { gql } from "graphql-request";

import { consortiumBrandSelection } from "@fragments/consortiumBrand";

/**
 * A FUNCTION, not a constant — see getConsortia for why the flag cannot be read at
 * module scope.
 *
 * The selection set is only half the job here. UpdateConsortiumInput does not declare
 * the brand keys before dcb-service 9.0.0, so the VARIABLES have to be filtered too -
 * blanking a key is not the same as omitting it, and an undeclared input field fails
 * validation exactly as an undeclared output field does. Every caller passes its input
 * through stripUnsupportedConsortiumInput; without it nothing on the consortium form
 * saves, brand or not.
 */
export const updateConsortiumQuery = () => gql`
	mutation UpdateConsortium($input: UpdateConsortiumInput!) {
		updateConsortium(input: $input) {
			id
			description
			catalogueSearchUrl
			websiteUrl
			${consortiumBrandSelection("full")}
		}
	}
`;
