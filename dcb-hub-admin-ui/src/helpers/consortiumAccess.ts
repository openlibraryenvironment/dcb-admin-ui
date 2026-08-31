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
