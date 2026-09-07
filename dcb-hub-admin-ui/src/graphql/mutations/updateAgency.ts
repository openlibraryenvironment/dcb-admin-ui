import { gql } from "graphql-request";

import { localHoldsSelection } from "@fragments/localHolds";

// A FUNCTION, not a constant: maxLocalHolds is on dcb-service main and in no release, so
// the selection has to be decided when the flag is readable rather than at module load.
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
