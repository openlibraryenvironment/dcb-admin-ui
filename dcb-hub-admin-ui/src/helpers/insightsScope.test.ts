import { describe, it, expect } from "vitest";

import {
	scopeCodes,
	scopeId,
	scopeOptionsFrom,
	selectedScope,
} from "@helpers/insightsScope";

/**
 * Turning the selection a URL carries into the Host LMS codes the statistics endpoints
 * take. The route does this in its loader, before the first query goes out, so it has to
 * be checkable without rendering anything.
 */

const library = (
	id: string,
	fullName: string,
	code: string | null,
	groups: { id: string; name: string }[] = [],
) => ({
	id,
	fullName,
	agency: code ? { hostLms: { code } } : {},
	membership: groups.map((libraryGroup) => ({ libraryGroup })),
});

const MOBIUS = { id: "g1", name: "Mobius" };
const POLARIS = { id: "g2", name: "Polaris sites" };

const data = {
	libraries: {
		content: [
			library("l1", "Alpha", "alpha-lms", [MOBIUS, POLARIS]),
			library("l2", "Beta", "beta-lms", [MOBIUS]),
			// Traffic but no Host LMS: nothing can be asked about it, so it is not offered.
			library("l3", "Gamma", null, [MOBIUS]),
		],
	},
};

describe("scopeOptionsFrom", () => {
	it("offers every library that resolves to a Host LMS code, and no others", () => {
		const libraries = scopeOptionsFrom(data).filter(
			(option) => option.kind === "library",
		);

		expect(libraries.map((option) => option.label)).toEqual(["Alpha", "Beta"]);
		expect(libraries.map((option) => option.codes)).toEqual([
			["alpha-lms"],
			["beta-lms"],
		]);
	});

	it("derives a group from membership, carrying only its members' own codes", () => {
		const groups = scopeOptionsFrom(data).filter(
			(option) => option.kind === "group",
		);

		expect(groups.map((option) => option.label)).toEqual([
			"Mobius",
			"Polaris sites",
		]);
		// Gamma is in Mobius and has no code, so the group is the two that do.
		expect(groups[0].codes).toEqual(["alpha-lms", "beta-lms"]);
		expect(groups[1].codes).toEqual(["alpha-lms"]);
	});

	it("keeps the groups together and first", () => {
		// Not cosmetic: MUI's `groupBy` renders a header every time the group changes, so
		// an interleaved list repeats "Groups" and "Libraries" down the menu.
		const kinds = scopeOptionsFrom(data).map((option) => option.kind);

		expect(kinds).toEqual(["group", "group", "library", "library"]);
	});

	it("reads an absent or empty response as nothing to offer", () => {
		expect(scopeOptionsFrom(undefined)).toEqual([]);
		expect(scopeOptionsFrom({ libraries: { content: [] } })).toEqual([]);
	});
});

describe("selectedScope", () => {
	it("picks out what the URL names, and ignores what it cannot match", () => {
		const options = scopeOptionsFrom(data);
		const selected = selectedScope(options, [
			"library:l1",
			"group:g1",
			// A library that has since been removed, or a hand-edited id.
			"library:gone",
		]);

		expect(selected.map(scopeId)).toEqual(["group:g1", "library:l1"]);
	});
});

describe("scopeCodes", () => {
	it("is the union of the chosen scopes, with each code named once", () => {
		const options = scopeOptionsFrom(data);
		// The group already covers alpha-lms, and so does the library beside it.
		const selected = selectedScope(options, ["group:g1", "library:l1"]);

		expect(scopeCodes(selected)).toBe("alpha-lms,beta-lms");
	});

	it("is undefined for the whole consortium, not an empty string", () => {
		// `cleanParams` drops an undefined parameter; an empty string would be sent, and
		// "every library" and "no library" are not the same question.
		expect(scopeCodes([])).toBeUndefined();
	});
});
