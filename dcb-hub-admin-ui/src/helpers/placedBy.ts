/** dcb-service's `placedByStaff`: true for staff, false for the patron, null when it cannot tell. */
export type PlacedBy = "staff" | "patron" | "unknown";

export const placedBy = (
	placedByStaff: boolean | null | undefined,
): PlacedBy =>
	placedByStaff === true
		? "staff"
		: placedByStaff === false
			? "patron"
			: "unknown";
