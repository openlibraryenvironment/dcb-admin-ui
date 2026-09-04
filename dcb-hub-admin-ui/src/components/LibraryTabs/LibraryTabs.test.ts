import { describe, expect, it } from "vitest";

import { TABS } from "@constants/libraryTabs";

/**
 * Each library page passes its own hardcoded index into this bar. That is a contract
 * between eleven files and one array, and nothing enforced it.
 *
 * It matters more than it looks. `value` indexes the UNFILTERED array while the rendered
 * set is filtered, so inserting a tab anywhere but the end silently moves every page after
 * it onto the wrong tab - a page that highlights the wrong thing, not a page that crashes.
 * With two conditionally hidden tabs the invariant is now carrying real weight.
 */
describe("library tab indices", () => {
	// The index each route file passes. Adding a row here is part of adding a tab.
	const EXPECTED: ReadonlyArray<[number, string]> = [
		[0, ""],
		[1, "/service"],
		[2, "/settings"],
		[3, "/referenceValueMappings/all"],
		[4, "/patronRequests/all"],
		[5, "/supplierRequests/all"],
		[6, "/contacts"],
		[7, "/locations"],
		[8, "/bibs"],
		[9, "/insights"],
		[10, "/accounts"],
	];

	it.each(EXPECTED)("index %i is %s", (index, path) => {
		expect(TABS[index]?.path).toBe(path);
	});

	it("has no more tabs than the pages that index it know about", () => {
		// A tab appended without a row above would be unreachable from this test, which
		// is the point at which somebody has added one without deciding its index.
		expect(TABS).toHaveLength(EXPECTED.length);
	});

	it("gives every tab a translation key rather than a literal label", () => {
		for (const tab of TABS) {
			expect(tab.labelKey).toMatch(/^[a-z][\w.]+$/);
		}
	});

	it("conditionally hidden tabs sit at the end, so hiding one cannot shift an index", () => {
		// Insights and Accounts are the two that can be hidden or empty. If either is
		// ever moved earlier, every index after it becomes wrong the moment it is
		// filtered out.
		const conditional = ["/insights", "/accounts"];
		const positions = conditional.map((path) =>
			TABS.findIndex((tab) => tab.path === path),
		);

		expect(positions).toEqual(
			positions.slice().sort((a, b) => a - b),
		);
		expect(Math.max(...positions)).toBe(TABS.length - 1);
	});
});
