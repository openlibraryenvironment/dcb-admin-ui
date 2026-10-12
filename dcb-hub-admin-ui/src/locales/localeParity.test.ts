import { describe, expect, it } from "vitest";

import enGB from "./en-GB/application.json";
import enUS from "./en-US/application.json";

// en-US is an overlay: only the strings whose spelling or wording differs from en-GB,
// which every other key falls back to. docs/i18n.md.

type Tree = { [key: string]: string | Tree };

const flatten = (tree: Tree, prefix = ""): Map<string, string> => {
	const out = new Map<string, string>();
	for (const [key, value] of Object.entries(tree)) {
		const path = prefix ? `${prefix}.${key}` : key;
		if (typeof value === "string") out.set(path, value);
		else for (const [k, v] of flatten(value, path)) out.set(k, v);
	}
	return out;
};

/** What must survive translation untouched: interpolations, nesting, and markup. */
const tokens = (value: string) =>
	(value.match(/\{\{[^}]+\}\}|\$t\([^)]*\)|<\/?[a-zA-Z]+\/?>/g) ?? []).sort();

/** Prose words; a URL is an example, not text to localise. */
const words = (value: string) =>
	value
		.replace(/https?:\/\/\S+/g, "")
		.toLowerCase()
		.match(/[a-z]+/g) ?? [];

const gb = flatten(enGB as Tree);
const us = flatten(enUS as Tree);

describe("the en-US overlay", () => {
	it("only overrides keys en-GB has", () => {
		expect([...us.keys()].filter((key) => !gb.has(key))).toEqual([]);
	});

	it("only carries strings that differ, so it cannot drift back into a copy", () => {
		expect([...us].filter(([key, value]) => gb.get(key) === value)).toEqual([]);
	});

	it("keeps every interpolation, nested key and tag in each string", () => {
		const drifted = [...us]
			.filter(
				([key, value]) =>
					JSON.stringify(tokens(value)) !==
					JSON.stringify(tokens(gb.get(key) ?? "")),
			)
			.map(([key]) => key);
		expect(drifted).toEqual([]);
	});

	// The British words the overlay already converts are the house rules; an en-GB
	// string using one of them without an override reads British to an en-US user.
	it("overrides every en-GB string that uses a British form it converts elsewhere", () => {
		const british = new Set<string>();
		for (const [key, value] of us) {
			const before = words(gb.get(key) ?? "");
			const after = words(value);
			if (before.length !== after.length) continue;
			before.forEach((word, i) => word !== after[i] && british.add(word));
		}
		const unconverted = [...gb]
			.filter(
				([key, value]) =>
					!us.has(key) && words(value).some((w) => british.has(w)),
			)
			.map(([key]) => key);

		expect(british.size).toBeGreaterThan(0);
		expect(unconverted).toEqual([]);
	});

	it("is actually a different English", () => {
		expect(gb.get("catalogMetricsByHostLms.name")).toMatch(/Catalogue/);
		expect(us.get("catalogMetricsByHostLms.name")).toMatch(/Catalog\b/);
	});
});
