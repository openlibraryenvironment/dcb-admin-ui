import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import enGB from "./en-GB/application.json";

// Languages other than English ship from public/locales and are fetched at runtime
const PUBLIC_LOCALES = path.resolve(__dirname, "../../public/locales");

type Tree = { [key: string]: string | Tree };

const flatten = (tree: Tree, prefix = ""): Map<string, string> => {
	const out = new Map<string, string>();
	for (const [key, value] of Object.entries(tree)) {
		const at = prefix ? `${prefix}.${key}` : key;
		if (typeof value === "string") out.set(at, value);
		else for (const [k, v] of flatten(value, at)) out.set(k, v);
	}
	return out;
};

// An interpolation or a <Trans> tag is code: translated, it renders as text or not at all
const tokens = (value: string) =>
	(value.match(/\{\{[^}]+\}\}|<\/?[\p{L}\p{N}_]+\s*\/?>/gu) ?? [])
		.map((token) => token.replace(/\s+/g, ""))
		.sort();

const gb = flatten(enGB as Tree);

describe.each(readdirSync(PUBLIC_LOCALES))("the %s catalogue", (language) => {
	const catalogue = flatten(
		JSON.parse(
			readFileSync(
				path.join(PUBLIC_LOCALES, language, "application.json"),
				"utf8",
			),
		),
	);

	it("keeps every interpolation and tag of the en-GB string it translates", () => {
		const differing = [...catalogue]
			.filter(([key]) => gb.has(key))
			.filter(
				([key, value]) =>
					tokens(value).join(" ") !== tokens(gb.get(key)!).join(" "),
			)
			.map(([key]) => key);

		expect(differing).toEqual([]);
	});
});
