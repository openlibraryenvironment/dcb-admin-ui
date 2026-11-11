/**
 * The operations whose dcb-service role set is NOT "ADMIN or CONSORTIUM_ADMIN", which is what
 * every other operation this application calls admits. Read on 8.71.0 and 9.3.0; widening
 * them in dcb-service makes the matching entry here a one-line change.
 */
export const SERVER_ROLES = {
	/** SupplierRequestController skip, cancel and PATCH active: @Secured(CONSORTIUM_ADMIN). */
	supplierActions: ["CONSORTIUM_ADMIN"],
	/** UpdateAgencyDataFetcher: CONSORTIUM_ADMIN only. */
	updateAgency: ["CONSORTIUM_ADMIN"],
	/** ObjectRulesetController, class-level @Secured(ADMINISTRATOR). */
	readRulesets: ["ADMIN"],
} as const satisfies Record<string, readonly string[]>;

export type ServerOperation = keyof typeof SERVER_ROLES;

/** Whether dcb-service would let a user with these roles perform the operation. */
export const serverAdmits = (
	operation: ServerOperation,
	roles: readonly string[] | null | undefined,
): boolean =>
	!!roles?.some((role) =>
		(SERVER_ROLES[operation] as readonly string[]).includes(role),
	);
