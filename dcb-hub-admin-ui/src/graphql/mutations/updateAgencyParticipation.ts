import { gql } from "graphql-request";

export const updateAgencyParticipationStatus = gql`
	mutation UpdateAgencyParticipationStatus(
		$input: UpdateAgencyParticipationInput!
	) {
		updateAgencyParticipationStatus(input: $input) {
			id
			code
			name
			isSupplyingAgency
			isBorrowingAgency
		}
	}
`;
