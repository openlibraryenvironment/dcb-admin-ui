import { gql } from "graphql-request";

import { localHoldsSelection } from "@fragments/localHolds";

// A FUNCTION, not a constant: maxLocalHolds is new in dcb-service 9.1.0, so the selection
// has to be decided when the flag is readable rather than at module load.
export const updateAgencyQuery = () => gql`
	mutation UpdateAgency($input: UpdateAgencyInput!) {
		updateAgency(input: $input) {
			id
			code
			name
			isSupplyingAgency
			isBorrowingAgency
			maxConsortialLoans
			${localHoldsSelection()}
		}
	}
`;
