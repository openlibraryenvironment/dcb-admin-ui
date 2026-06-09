import { gql } from "graphql-request";

export const updateLibraryMutation = gql`
	mutation UpdateLibrary($input: UpdateLibraryInput!) {
		updateLibrary(input: $input) {
			id
			fullName
			shortName
			abbreviatedName
			backupDowntimeSchedule
			supportHours
			latitude
			longitude
		}
	}
`;
