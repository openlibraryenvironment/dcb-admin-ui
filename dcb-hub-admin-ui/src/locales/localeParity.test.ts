import { describe, expect, it } from "vitest";

import enGB from "./en-GB/application.json";
import enUS from "./en-US/application.json";

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

const gb = flatten(enGB as Tree);
const us = flatten(enUS as Tree);

describe("the two English translations", () => {
	it("carry exactly the same keys", () => {
		const onlyGb = [...gb.keys()].filter((key) => !us.has(key));
		const onlyUs = [...us.keys()].filter((key) => !gb.has(key));

		expect({ onlyGb, onlyUs }).toEqual({ onlyGb: [], onlyUs: [] });
	});

	it("keep every interpolation, nested key and tag in each string", () => {
		const drifted = [...gb.entries()]
			.filter(([key, value]) => {
				const other = us.get(key);
				return (
					other !== undefined &&
					JSON.stringify(tokens(value)) !== JSON.stringify(tokens(other))
				);
			})
			.map(([key]) => key);

		expect(drifted).toEqual([]);
	});

	it("are actually different Englishes", () => {
		expect(gb.get("catalogMetricsByHostLms.name")).toMatch(/Catalogue/);
		expect(us.get("catalogMetricsByHostLms.name")).toMatch(/Catalog\b/);
	});
});
