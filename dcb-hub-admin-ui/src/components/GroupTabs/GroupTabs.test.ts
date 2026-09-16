import { describe, expect, it } from "vitest";

import { TABS } from "@constants/groupTabs";

/**
 * Each group page passes its own hardcoded index into this bar - a contract between five
 * files and one array, with nothing enforcing it.
 *
 * `value` indexes the UNFILTERED array while the rendered set is filtered, so inserting a
 * tab anywhere but the end silently moves every page after it onto the wrong tab. That is
 * a page highlighting the wrong thing, not a page that crashes.
 */
describe("group tab indices", () => {
	// The index each route file passes. Adding a row here is part of adding a tab.
	const EXPECTED: ReadonlyArray<[number, string]> = [
		[0, ""],
		[1, "/patronRequests"],
		[2, "/supplierRequests"],
		[3, "/settings"],
		[4, "/insights"],
	];

	it.each(EXPECTED)("index %i is %s", (index, path) => {
		expect(TABS[index]?.path).toBe(path);
	});

	it("has no more tabs than the pages that index it know about", () => {
		expect(TABS).toHaveLength(EXPECTED.length);
	});

	it("gives every tab a translation key rather than a literal label", () => {
		for (const tab of TABS) {
			expect(tab.labelKey).toMatch(/^[a-z][\w.]+$/);
		}
	});

	it("the conditionally hidden tab sits last, so hiding it cannot shift an index", () => {
		expect(TABS[TABS.length - 1]?.path).toBe("/insights");
	});
});
