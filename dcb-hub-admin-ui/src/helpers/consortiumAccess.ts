import { adminOrConsortiumAdmin } from "@constants/roles";

/**
 * Whether a set of token roles belongs to consortium staff.
 *
 * <h2>Why one function rather than the same expression in twenty files</h2>
 *
 * `userRoles.includes("ADMIN") || userRoles.includes("CONSORTIUM_ADMIN")` was written
 * inline in about twenty route files, and the copies had already drifted: the patron
 * request page gated Cleanup on `LIBRARY_ADMIN` alone while the grid's bulk action for the
 * same capability allowed any admin. One capability, two gates, disagreeing — and neither
 * of them testable, because the decision only existed inside a component.
 *
 * This is the decision on its own, with tests. The hook and the layout guard both read it.
 *
 * <h2>What this is NOT</h2>
 *
 * It is not a security control, and nothing here should ever be described as one. Hiding a
 * button is UX. The controls are `@Secured` and `GraphQLRoles.CONSORTIUM` in dcb-service,
 * plus the `azp` bar in `AdminUiAccessPolicy`. This only stops an honest user being shown a
 * page whose every request would fail.
 */
export function isConsortiumStaff(roles: readonly string[] | undefined): boolean {
	if (!roles) {
		return false;
	}

	return roles.some((role) => adminOrConsortiumAdmin.includes(role));
}

/**
 * Whether this account may use DCB Admin at all.
 *
 * Identical to {@link isConsortiumStaff} today, and deliberately a separate name: one
 * answers "may they do consortium things", the other "may they be here". They have been
 * the same answer since DCB Admin became consortium-only, but they are different questions
 * and a future decision to admit some other role to a read-only view would change exactly
 * one of them.
 */
export function canAccessDcbAdmin(roles: readonly string[] | undefined): boolean {
	return isConsortiumStaff(roles);
}

/** The roles that belong to DCB Admin for Libraries rather than to DCB Admin. */
const LIBRARY_ROLES = ["LIBRARY_ADMIN", "LIBRARY_READ_ONLY"];

/**
 * Whether this account belongs in DCB Admin for Libraries INSTEAD of here.
 *
 * True only for somebody holding a library role and NO consortium role. That "and no" is
 * the whole point: plenty of consortium staff are also administrators of their own
 * library, and their token carries both. Telling that person they are in the wrong place
 * would be telling them to leave an application they are entitled to use.
 *
 * Distinct from simply failing {@link canAccessDcbAdmin}, which is also true of an account
 * with no roles at all, or with only DISCOVERY_SERVICE. Those are not people who took a
 * wrong turning - there is no other application to send them to, and guessing would be
 * worse than the generic refusal.
 */
export function belongsInLibrariesApp(
	roles: readonly string[] | undefined,
): boolean {
	if (!roles || isConsortiumStaff(roles)) {
		return false;
	}

	return roles.some((role) => LIBRARY_ROLES.includes(role));
}
