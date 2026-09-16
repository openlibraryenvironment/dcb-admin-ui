import { describe, expect, it } from "vitest";

import { composeQuery, drillSearchSchema } from "./drillSearch";

describe("composing a drill-down filter with a tab's preset", () => {
	it("parenthesises the filter, so it cannot bind to half of an OR", () => {
		// The finished preset is a disjunction. Appending a bare term to it would bind to
		// the last branch only and return every cancelled request in the estate.
		const preset = `(status: "CANCELLED" OR status: "FINALISED")`;

		expect(composeQuery(preset, 'patronHostlmsCode:"a"')).toBe(
			`(status: "CANCELLED" OR status: "FINALISED") AND (patronHostlmsCode:"a")`,
		);
	});

	it("is the preset alone when no filter is carried", () => {
		expect(composeQuery('status: "ERROR"', undefined)).toBe('status: "ERROR"');
		expect(composeQuery('status: "ERROR"', "   ")).toBe('status: "ERROR"');
	});

	it("is the filter alone when the tab has no preset", () => {
		expect(composeQuery("", 'status:"ERROR"')).toBe('status:"ERROR"');
	});
});

describe("the drill-down search parameters", () => {
	it("keeps a filter, a return path and its label", () => {
		expect(
			drillSearchSchema.parse({
				q: 'status:"ERROR"',
				from: "/consortium/insights?tab=service",
				fromLabel: "Why requests fail",
			}),
		).toEqual({
			q: 'status:"ERROR"',
			from: "/consortium/insights?tab=service",
			fromLabel: "Why requests fail",
		});
	});

	it("refuses a return path that leaves this application", () => {
		// A back link whose target comes from the URL is an open redirect if it can name
		// another origin. It is only a back button today, which is not an argument.
		for (const from of [
			"https://evil.example/phish",
			"//evil.example/phish",
			"javascript:alert(1)",
		]) {
			expect(drillSearchSchema.parse({ from }).from).toBeUndefined();
		}
	});

	it("degrades to an unfiltered tab rather than throwing", () => {
		expect(drillSearchSchema.parse({ q: 42, from: 7 })).toEqual({
			q: undefined,
			from: undefined,
			fromLabel: undefined,
		});
	});
});
