import type { LibraryGroupMember } from "@models/LibraryGroupMember";

export type Participation = "borrowing" | "supplying";

const FIELD = {
	borrowing: "isBorrowingAgency",
	supplying: "isSupplyingAgency",
} as const;

/**
 * The agency codes a group-wide enable or disable would actually change: members with an
 * agency that is not already in the target state. Writing the others would log a change,
 * with the operator's reason, against an agency that did not change.
 */
export const participationChanges = (
	members: readonly LibraryGroupMember[],
	type: Participation,
	enable: boolean,
): string[] =>
	members.flatMap((member) => {
		const agency = member.library?.agency;
		const code = member.library?.agencyCode;
		if (!agency || !code) return [];
		return Boolean(agency[FIELD[type]]) === enable ? [] : [code];
	});
