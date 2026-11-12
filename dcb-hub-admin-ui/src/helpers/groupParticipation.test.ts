import { describe, expect, it } from "vitest";

import type { LibraryGroupMember } from "@models/LibraryGroupMember";
import { participationChanges } from "./groupParticipation";

const member = (
	agencyCode: string | null,
	agency: { isBorrowingAgency?: boolean; isSupplyingAgency?: boolean } | null,
) => ({ library: { agencyCode, agency } }) as unknown as LibraryGroupMember;

const GROUP = [
	member("ON", { isBorrowingAgency: true, isSupplyingAgency: false }),
	member("OFF", { isBorrowingAgency: false, isSupplyingAgency: true }),
	member("UNSET", {}),
	member(null, { isBorrowingAgency: false }),
	member("NOAGENCY", null),
];

describe("participationChanges", () => {
	it("disables only the members that borrow", () => {
		expect(participationChanges(GROUP, "borrowing", false)).toEqual(["ON"]);
	});

	it("enables only the members that do not, an unset flag among them", () => {
		expect(participationChanges(GROUP, "borrowing", true)).toEqual([
			"OFF",
			"UNSET",
		]);
	});

	it("reads the supplying flag for supplying", () => {
		expect(participationChanges(GROUP, "supplying", false)).toEqual(["OFF"]);
	});

	it("leaves out a member with no agency or no agency code", () => {
		expect(participationChanges(GROUP, "borrowing", true)).not.toContain(
			"NOAGENCY",
		);
	});
});
