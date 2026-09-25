import { describe, expect, it } from "vitest";

import { actionProgressMessage, statusChange } from "@helpers/actionProgress";

describe("actionProgressMessage", () => {
	const idle = [
		{ running: false, message: "Checking for updates" },
		{ running: false, message: "Cleanup in progress" },
	];

	it("says nothing while no action is running", () => {
		expect(actionProgressMessage(idle)).toBeNull();
	});

	it("names the action that is running, not the one that was clicked last", () => {
		expect(
			actionProgressMessage([
				{ running: false, message: "Checking for updates" },
				{ running: true, message: "Cleanup in progress" },
			]),
		).toBe("Cleanup in progress");
	});

	it("adds the slow-path message only once the threshold has passed", () => {
		const actions = [{ running: true, message: "Checking for updates" }];

		expect(actionProgressMessage(actions, null)).toBe("Checking for updates");
		expect(actionProgressMessage(actions, "the library's system is slow")).toBe(
			"Checking for updates — the library's system is slow",
		);
	});

	it("withholds the slow-path message when nothing is running", () => {
		// The threshold timer is cleared when an action settles, but a settle and a
		// timeout that land in the same tick would otherwise announce a wait that is
		// over - which reads as the action having hung at the moment it succeeded.
		expect(
			actionProgressMessage(idle, "the library's system is slow"),
		).toBeNull();
	});
});

describe("statusChange", () => {
	it("reports a move", () => {
		expect(statusChange("ERROR", "REQUEST_PLACED_AT_BORROWING_AGENCY")).toEqual(
			{
				kind: "changed",
				from: "ERROR",
				to: "REQUEST_PLACED_AT_BORROWING_AGENCY",
			},
		);
	});

	it("reports the ordinary outcome, which is that nothing moved", () => {
		expect(statusChange("PICKUP_TRANSIT", "PICKUP_TRANSIT")).toEqual({
			kind: "unchanged",
			status: "PICKUP_TRANSIT",
		});
	});

	it("claims nothing when either side is missing", () => {
		// A refetch that failed, or a request that has gone, leaves no status. Saying
		// "unchanged" there would assert that the action did nothing, which is not what
		// an absent answer means.
		for (const pair of [
			["ERROR", undefined],
			[undefined, "ERROR"],
			[undefined, undefined],
			["", "ERROR"],
		] as const) {
			expect(statusChange(pair[0], pair[1])).toEqual({ kind: "unknown" });
		}
	});
});
