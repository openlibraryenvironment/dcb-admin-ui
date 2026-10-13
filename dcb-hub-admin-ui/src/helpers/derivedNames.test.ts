import { describe, it, expect } from "vitest";

import { abbreviationOf, namesFollowingFullName } from "./derivedNames";

describe("derivedNames", () => {
	it("abbreviates by the words that carry the name", () => {
		expect(abbreviationOf("University of Colorado Boulder")).toBe("UCB");
		expect(abbreviationOf("The Denver Public Library")).toBe("DPL");
	});

	it("fills empty names from the full name", () => {
		expect(
			namesFollowingFullName("", "Denver Public Library", {
				shortName: "",
				abbreviatedName: "",
			}),
		).toEqual({ shortName: "Denver Public Library", abbreviatedName: "DPL" });
	});

	it("keeps following while the user has not changed them", () => {
		expect(
			namesFollowingFullName("Denver Public", "Denver Public Library", {
				shortName: "Denver Public",
				abbreviatedName: "DP",
			}),
		).toEqual({ shortName: "Denver Public Library", abbreviatedName: "DPL" });
	});

	// A resumed library's stored names were not derived from the name being edited
	it("leaves a name the user, or the stored record, set", () => {
		expect(
			namesFollowingFullName(
				"Denver Public Library",
				"Denver Public Libraries",
				{
					shortName: "Denver PL",
					abbreviatedName: "DPL-MAIN",
				},
			),
		).toEqual({});
	});
});
