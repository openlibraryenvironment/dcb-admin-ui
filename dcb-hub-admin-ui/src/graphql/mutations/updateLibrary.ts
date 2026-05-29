import { gql } from "graphql-request";

export const updateLibraryQuery = gql`
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
