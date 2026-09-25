import { gql } from "graphql-request";

/**
 * Overriding a functional setting at a scope, and taking the override away — §V-22.6.
 *
 * Functions rather than constants, and only ever sent behind
 * `isSettingsInheritanceEnabled`: dcb-service declares neither on any release, and an
 * undeclared mutation fails the whole operation rather than returning null.
 *
 * One mutation serves one scope and forty. "This library differs" and "these twelve
 * libraries differ" are the same write, and a separate single-scope mutation would be a
 * second copy of the same rules that would eventually disagree with this one.
 */
export const setFunctionalSettingAtScopes = () => gql`
	mutation SetFunctionalSettingAtScopes($input: SetFunctionalSettingAtScopesInput!) {
		setFunctionalSettingAtScopes(input: $input) {
			name
			scopeType
			changed
			scopeIds
		}
	}
`;

/**
 * Removing the explicit rows so those scopes inherit again.
 *
 * NOT the same as writing the parent's value into them. §V-22.6a: an explicit value that
 * happens to match the parent is indistinguishable from a choice once stored, and the
 * consortium's next change would then be silently wrong for that library.
 */
export const revertFunctionalSettingToInherited = () => gql`
	mutation RevertFunctionalSettingToInherited(
		$input: RevertFunctionalSettingAtScopesInput!
	) {
		revertFunctionalSettingToInherited(input: $input) {
			name
			scopeType
			changed
			scopeIds
		}
	}
`;
