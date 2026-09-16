import { describe, expect, it } from "vitest";

import { groupCodesOf, groupOf } from "./insightsGroupScope";

import groupDetail from "../../e2e/fixtures-data/group-detail.json";

/**
 * A group's scope is the set of its members' Host LMS codes, which is exactly what every
 * scoped Insights endpoint already takes. The whole of group insights rests on that being
 * derived correctly - a wrong or empty set is a page of plausible figures for the wrong
 * libraries, which nothing downstream can detect.
 */
describe("a group's Insights scope", () => {
	it("is its members' Host LMS codes, comma separated", () => {
		expect(groupCodesOf(groupDetail)).toBe("alpha-lms,beta-lms");
	});

	it("counts a Host LMS once however many members share it", () => {
		// The statistics are filtered by Host LMS, not by library, so a repeated code
		// would ask the same question twice and say nothing new.
		const shared = {
			libraryGroups: {
				content: [
					{
						members: [
							{ library: { agency: { hostLms: { code: "shared-lms" } } } },
							{ library: { agency: { hostLms: { code: "shared-lms" } } } },
						],
					},
				],
			},
		};

		expect(groupCodesOf(shared)).toBe("shared-lms");
	});

	it("is undefined when no member has a Host LMS, rather than an empty filter", () => {
		// An empty string would be sent as `libraryCode=`, which the API reads as "no
		// filter" - a group with no Host LMS would silently show the whole consortium's
		// figures under the group's name.
		const none = {
			libraryGroups: {
				content: [{ members: [{ library: { agency: null } }] }],
			},
		};

		expect(groupCodesOf(none)).toBeUndefined();
		expect(groupCodesOf({})).toBeUndefined();
	});

	it("reads the group itself from the same response", () => {
		expect(groupOf(groupDetail)?.name).toBe("Midlands Group");
		expect(groupOf(undefined)).toBeUndefined();
	});
});
