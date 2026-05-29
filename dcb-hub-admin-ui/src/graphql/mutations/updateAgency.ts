import { gql } from "graphql-request";

export const updateAgencyQuery = gql`
	mutation UpdateAgency($input: UpdateAgencyInput!) {
		updateAgency(input: $input) {
			id
			code
			name
			isSupplyingAgency
			isBorrowingAgency
			maxConsortialLoans
		}
	}
`;
