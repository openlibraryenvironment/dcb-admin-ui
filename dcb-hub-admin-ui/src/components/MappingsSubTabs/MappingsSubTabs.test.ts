import { describe, expect, it } from "vitest";
import { readdirSync } from "fs";
import { resolve } from "path";

import {
	MAPPING_BASE,
	MAPPING_TABS,
	mappingTabPath,
} from "@constants/mappingsTabs";

import en from "../../locales/en-GB/application.json";

const ROUTES = resolve(
	__dirname,
	"../../routes/__authenticated/libraries/$libraryId",
);

/** Every mappings page that exists, as `<base>/<category>`. */
const routePages = Object.values(MAPPING_BASE).flatMap((base) =>
	readdirSync(resolve(ROUTES, base))
		.filter((file) => file.endsWith(".tsx"))
		.map((file) => `${base}/${file.replace(/\.tsx$/, "")}`),
);

const translation = (key: string): unknown =>
	key.split(".").reduce<any>((node, part) => node?.[part], en);

describe("library mappings tab bar", () => {
	it("finds the mappings pages it is meant to be checking", () => {
		// Guards the test: a wrong path here would read an empty directory and make
		// every reachability assertion below vacuously true.
		expect(routePages.length).toBeGreaterThanOrEqual(7);
	});

	/**
	 * The regression this file exists for. The bar used to be built per mapping type,
	 * so the numeric range pages were listed only by the numeric pages themselves and
	 * nothing anywhere linked to them. Sierra and Polaris libraries lost the numeric
	 * mappings UI entirely; the pages answered a typed URL and nothing else.
	 */
	it("offers a tab for every mappings page, so none is reachable by URL alone", () => {
		const tabbed = MAPPING_TABS.map(
			(tab) => `${MAPPING_BASE[tab.type]}/${tab.category}`,
		);

		expect(tabbed.slice().sort()).toEqual(routePages.slice().sort());
	});

	it("points every tab at a page that exists", () => {
		for (const tab of MAPPING_TABS) {
			expect(routePages).toContain(`${MAPPING_BASE[tab.type]}/${tab.category}`);
		}
	});

	it("covers both mapping types, not just the one the page is on", () => {
		const types = new Set(MAPPING_TABS.map((tab) => tab.type));
		expect(types).toEqual(new Set(["referenceValue", "numericRange"]));
	});

	it("builds a library-scoped path for each tab", () => {
		expect(mappingTabPath("lib-1", "numericRange", "all")).toBe(
			"/libraries/lib-1/numericRangeMappings/all",
		);
		expect(mappingTabPath("lib-1", "referenceValue", "location")).toBe(
			"/libraries/lib-1/referenceValueMappings/location",
		);
	});

	it("gives every tab a translated label rather than a literal", () => {
		for (const tab of MAPPING_TABS) {
			expect(
				translation(tab.labelKey),
				`${tab.labelKey} is missing from en-GB`,
			).toBeTypeOf("string");
		}
	});

	it("distinguishes a reference-value tab from its numeric counterpart", () => {
		// Both item-type tabs sit next to each other, so two tabs reading "Item type"
		// would be a bar you cannot navigate by its accessible names.
		const labels = MAPPING_TABS.map((tab) => translation(tab.labelKey));
		expect(new Set(labels).size).toBe(MAPPING_TABS.length);
	});
});
