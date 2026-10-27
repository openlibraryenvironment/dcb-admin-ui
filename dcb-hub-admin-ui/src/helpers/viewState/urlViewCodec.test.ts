import { describe, expect, it } from "vitest";

import fixtures from "./url-view-state-fixtures.json";
import {
	decodeFilter,
	decodePage,
	decodeSort,
	decodeView,
	encodeFilter,
	encodePage,
	encodeView,
	paramName,
	type UrlFilter,
	type UrlView,
} from "./urlViewCodec";

// The shared cases every app's copy of the codec must pass; the file is compared across repos.

describe("the shared fixtures", () => {
	it.each(fixtures.filters)("reads $text", ({ text, filter }) => {
		expect(decodeFilter(text)).toEqual(filter);
	});

	it.each(fixtures.encodings)("writes $text", ({ filter, text }) => {
		expect(encodeFilter(filter as UrlFilter)).toBe(text);
	});

	it.each(fixtures.sorts)("reads the sort $text", ({ text, sort }) => {
		expect(decodeSort(text)).toEqual(sort);
	});

	it.each(fixtures.pages)(
		"reads page $raw (legacy: $legacy) as $page",
		({ raw, legacy, page }) => {
			expect(decodePage(raw, legacy) ?? null).toBe(page);
		},
	);

	it.each(fixtures.views)("$name", ({ namespace, search, view, ...rest }) => {
		const ns = namespace ?? undefined;
		expect(decodeView(search, ns)).toEqual(view);
		// Whatever a link said, writing what was read and reading it again changes nothing
		expect(decodeView(encodeView(view as UrlView, ns), ns)).toEqual(view);
		if ("canonical" in rest && rest.canonical) {
			expect(encodeView(view as UrlView, ns)).toEqual(search);
		}
	});
});

describe("every filter the grammar writes reads back as itself", () => {
	it.each(
		fixtures.filters.filter(
			(entry): entry is typeof entry & { filter: UrlFilter } =>
				entry.filter !== null,
		),
	)("$text", ({ filter }) => {
		const text = encodeFilter(filter);
		expect(text).not.toBeNull();
		expect(decodeFilter(text)).toEqual(filter);
	});
});

describe("pages", () => {
	it("never writes the first page, and writes the rest one-based", () => {
		expect(encodePage(0)).toBeUndefined();
		expect(encodePage(1)).toBe("2");
		expect(decodePage(encodePage(4))).toBe(4);
	});
});

describe("namespaces", () => {
	it("prefix every parameter, and refuse a name that could collide", () => {
		expect(paramName("filters", "notShown")).toBe("notShown.filters");
		expect(paramName("page")).toBe("page");
		expect(() => paramName("page", "Not-a-name")).toThrow();
	});
});
