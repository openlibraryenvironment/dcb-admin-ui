import { describe, it, expect } from "vitest";

import { announcementParts } from "./insightsAnnouncement";

/**
 * The announcement is the only thing that tells a screen-reader user the whole dashboard
 * just changed underneath them, so what it says has to be right for every combination of
 * the two controls that can change it.
 */
describe("what the dashboard announces when the view changes", () => {
	const format = (iso: string) => iso.slice(0, 10);

	it("names the preset and the whole consortium by default", () => {
		const parts = announcementParts("30d", null, undefined, format);

		expect(parts.range).toEqual({ key: "insights.range.30d" });
		expect(parts.scope).toEqual({ key: "insights.announce.whole_consortium" });
	});

	it("reads an explicit window as a date span, not as a preset", () => {
		const parts = announcementParts(
			"30d",
			{ startDate: "2026-08-01T00:00:00Z", endDate: "2026-08-31T23:59:59Z" },
			undefined,
			format,
		);

		expect(parts.range).toEqual({ literal: "2026-08-01 - 2026-08-31" });
	});

	it("counts the libraries in a set scope", () => {
		expect(announcementParts("7d", null, "LIB_A", format).scope).toEqual({
			key: "insights.announce.one_library",
		});

		expect(
			announcementParts("7d", null, "LIB_A,LIB_B,LIB_C", format).scope,
		).toEqual({
			key: "insights.announce.libraries",
			count: 3,
		});
	});

	it("does not read an empty selection as one library", () => {
		// A caller joining an empty list produces "", and announcing "1 library" there
		// would tell the user the view narrowed when it did not.
		for (const empty of ["", " ", ",", " , "]) {
			expect(announcementParts("7d", null, empty, format).scope).toEqual({
				key: "insights.announce.whole_consortium",
			});
		}
	});
});
