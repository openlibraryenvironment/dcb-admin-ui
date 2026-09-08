import { gql } from "graphql-request";

// One library's DCB Admin for Libraries accounts.
//
// Bounded by staff headcount - tens of rows - so this is not paged. The server has no
// consortium-wide roster to ask for, deliberately: that would be a different query with
// different scale properties.
export const getLibraryUsers = gql`
	query LoadLibraryUsers($libraryId: ID!) {
		libraryUsers(libraryId: $libraryId) {
			id
			email
			firstName
			lastName
			role
			status
			agencyCode
			dateCreated
			lastEditedBy
		}
	}
`;

// Whether the deployment has an identity provider wired at all. Read once per page so a
// tab that could only fail is not offered.
export const getLibraryUserProvisioningAvailable = gql`
	query LibraryUserProvisioningAvailable {
		libraryUserProvisioningAvailable
	}
`;
