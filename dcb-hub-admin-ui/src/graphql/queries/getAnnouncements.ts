import { gql } from "graphql-request";

/**
 * Every announcement at one scope, live or not — V-12.
 *
 * A FUNCTION, not a constant: it is only ever sent behind `isAnnouncementsEnabled`, and a
 * document built at module scope would be built before `window.__APP_ENV__` exists.
 *
 * The expired and not-yet-started ones are included deliberately. A patron reads only the
 * live ones, from an anonymous discovery endpoint; an administrator needs to see the notice
 * that ended yesterday, because "why has that gone" is the question they are about to ask.
 */
export const getAnnouncements = () => gql`
	query LoadAnnouncements($scopeType: String!, $scopeId: ID!) {
		announcements(scopeType: $scopeType, scopeId: $scopeId) {
			id
			scopeType
			scopeId
			headline
			body
			urgent
			dismissible
			startsAt
			expiresAt
			lastEditedBy
			dateUpdated
		}
	}
`;
