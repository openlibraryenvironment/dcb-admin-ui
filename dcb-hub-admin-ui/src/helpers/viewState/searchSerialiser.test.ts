import { describe, expect, it } from "vitest";
import { defaultParseSearch } from "@tanstack/react-router";

import fixtures from "./url-view-state-fixtures.json";
import { stringifySearch } from "./searchSerialiser";
import { decodeView, encodeView, type UrlView } from "./urlViewCodec";

const roundTrip = (search: Record<string, unknown>) =>
	defaultParseSearch(stringifySearch(search));

describe("the address bar is readable", () => {
	it("writes a view's parameters as a person would type them", () => {
		expect(
			stringifySearch({
				filters: [
					"status:SUBMITTED_TO_DCB,CONFIRMED",
					"title:contains:local history",
				],
				sort: "dateCreated:desc",
				page: 2,
				hide: "id,sourceSystem",
			}),
		).toBe(
			"?filters=status:SUBMITTED_TO_DCB,CONFIRMED&filters=title:contains:local+history" +
				"&sort=dateCreated:desc&page=2&hide=id,sourceSystem",
		);
	});

	it("leaves a path readable", () => {
		expect(stringifySearch({ from: "/consortium/insights" })).toBe(
			"?from=/consortium/insights",
		);
	});

	it("writes nothing for an empty search", () => {
		expect(stringifySearch({})).toBe("");
		expect(stringifySearch({ q: undefined })).toBe("");
	});
});

describe("every value reads back as itself", () => {
	it.each([
		["a plain word", "history"],
		["text with spaces", "local history"],
		["a numeric-looking string", "123"],
		["a boolean-looking string", "true"],
		["JSON-looking text", "[1,2]"],
		["a quoted phrase", '"exact phrase"'],
		["separators and reserved characters", "a&b=c?d#e%f+g"],
		["a backslash", "C:\\temp"],
		["non-Latin text", "Ångström 東京"],
		["an empty string", ""],
	])("%s", (_label, value) => {
		expect(roundTrip({ q: value })).toEqual({ q: value });
	});

	it.each([
		["a number", 17.5],
		["zero", 0],
		["a boolean", false],
		["null", null],
		["an object", { a: 1, b: ["x"] }],
	])("%s", (_label, value) => {
		expect(roundTrip({ v: value })).toEqual({ v: value });
	});

	it("repeats an array's key, and reads it back as the array", () => {
		const search = { scope: ["group:7f3a", "library:91c2"] };
		expect(stringifySearch(search)).toBe(
			"?scope=group:7f3a&scope=library:91c2",
		);
		expect(roundTrip(search)).toEqual(search);
	});

	it("reads a one-element array back as its element, which list params accept", () => {
		expect(roundTrip({ scope: ["group:7f3a"] })).toEqual({
			scope: "group:7f3a",
		});
	});

	it("keeps an empty array distinct from an absent one", () => {
		expect(stringifySearch({ series: [] })).toBe("?series=");
		expect(roundTrip({ series: [] })).toEqual({ series: "" });
		expect(roundTrip({})).toEqual({});
	});
});

describe("old links still read", () => {
	it("reads a list the old serialiser wrote as JSON", () => {
		expect(
			defaultParseSearch(
				"?scope=%5B%22group%3A7f3a%22%2C%22library%3A91c2%22%5D",
			),
		).toEqual({ scope: ["group:7f3a", "library:91c2"] });
	});

	it("reads a string the old serialiser quoted", () => {
		expect(defaultParseSearch("?q=%22123%22")).toEqual({ q: "123" });
	});
});

describe("a view survives the address bar", () => {
	it.each(fixtures.views)("$name", ({ namespace, view }) => {
		const ns = namespace ?? undefined;
		const search = roundTrip(encodeView(view as UrlView, ns));
		expect(decodeView(search, ns)).toEqual(view);
	});
});
