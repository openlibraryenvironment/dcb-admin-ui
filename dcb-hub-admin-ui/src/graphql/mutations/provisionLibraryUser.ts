import { gql } from "graphql-request";

// No agencyCode in the input, deliberately: the server derives it from the library, so a
// client that cannot name an agency cannot scope an account to somebody else's library.
export const provisionLibraryUser = gql`
	mutation ProvisionLibraryUser($input: ProvisionLibraryUserInput!) {
		provisionLibraryUser(input: $input) {
			id
			email
			role
			status
		}
	}
`;

export const setLibraryUserEnabled = gql`
	mutation SetLibraryUserEnabled($input: SetLibraryUserEnabledInput!) {
		setLibraryUserEnabled(input: $input) {
			id
			status
		}
	}
`;

export const resendLibraryUserInvite = gql`
	mutation ResendLibraryUserInvite($input: ResendLibraryUserInviteInput!) {
		resendLibraryUserInvite(input: $input) {
			id
			status
		}
	}
`;
