import { gql } from "graphql-request";

/**
 * Functions rather than constants, sent only behind `isAnnouncementsEnabled`: no dcb-service
 * release declares these, and an undeclared mutation fails the whole operation.
 *
 * `UpdateAnnouncementInput` has no scope by dcb-service's design: an edit must not widen a
 * library's notice to consortium reach without the confirmation the create path asks for.
 */
export const createAnnouncementQuery = () => gql`
	mutation CreateAnnouncement($input: CreateAnnouncementInput!) {
		createAnnouncement(input: $input) {
			id
			headline
			urgent
			expiresAt
		}
	}
`;

export const updateAnnouncementQuery = () => gql`
	mutation UpdateAnnouncement($input: UpdateAnnouncementInput!) {
		updateAnnouncement(input: $input) {
			id
			headline
			urgent
			expiresAt
		}
	}
`;

export const deleteAnnouncementQuery = () => gql`
	mutation DeleteAnnouncement($input: DeleteEntityInput!) {
		deleteAnnouncement(input: $input) {
			success
			message
		}
	}
`;
