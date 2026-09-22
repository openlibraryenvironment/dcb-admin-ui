import { gql } from "graphql-request";

import { capabilitySelection } from "@helpers/capabilityFields";

/**
 * A FUNCTION, not a constant — the brand fields are on Library and UpdateLibraryInput
 * from dcb-service 9.0.0 only, and the flag cannot be read at module scope.
 *
 * The INPUT side is handled centrally: useEntityMutation strips every key the
 * deployment's capabilities say it cannot accept, so no caller has to filter the brand
 * keys out of its own variables.
 */
export const updateLibraryMutation = () => gql`
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
			${capabilitySelection("consortium_branding", "Library")}
		}
	}
`;
