import { gql } from "graphql-request";

/**
 * Every functional setting as it resolves for one scope. `source` and `sourceName` — the
 * level that decided it — are what make an override identifiable, and so revertible.
 *
 * Functions, not constants: sent only behind `isSettingsInheritanceEnabled`, and a document
 * built at module scope would be built before `window.__APP_ENV__` exists.
 */
export const getResolvedFunctionalSettings = () => gql`
	query LoadResolvedFunctionalSettings($scopeType: String!, $scopeId: ID!) {
		resolvedFunctionalSettings(scopeType: $scopeType, scopeId: $scopeId) {
			name
			enabled
			source
			sourceId
			sourceName
			inherited
			lastEditedBy
			dateUpdated
		}
	}
`;

/**
 * Which library group type carries settings on this deployment — §V-22.6b.
 *
 * Null means there is none, and the chain is library then consortium. The UI has to be told
 * rather than assume: a deployment that has configured no settings-bearing type has no group
 * level at all, and naming one would describe a level it does not have.
 */
export const getSettingsBearingGroupType = () => gql`
	query LoadSettingsBearingGroupType {
		settingsBearingGroupType
	}
`;
