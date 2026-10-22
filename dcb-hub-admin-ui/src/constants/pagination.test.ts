import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import {
	MAX_DEFAULT_PAGE_SIZE,
	PAGE_SIZE_OPTIONS,
} from "@constants/pagination";

describe("page size options", () => {
	it("offer 200 at most", () => {
		expect(Math.max(...PAGE_SIZE_OPTIONS)).toBe(200);
	});

	it("include the largest default, so a grid never opens on a size it cannot show", () => {
		expect(PAGE_SIZE_OPTIONS).toContain(MAX_DEFAULT_PAGE_SIZE);
	});
});

describe("no grid opens on a page larger than the default ceiling", () => {
	const repoRoot = process.cwd();

	const sourcesUnder = (dir: string): string[] =>
		readdirSync(path.resolve(repoRoot, dir), { withFileTypes: true }).flatMap(
			(entry) => {
				const next = path.join(dir, entry.name);
				if (entry.isDirectory()) return sourcesUnder(next);
				return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)
					? [next]
					: [];
			},
		);

	const sources = sourcesUnder("src").map((file) => ({
		file,
		source: readFileSync(path.resolve(repoRoot, file), "utf8"),
	}));

	// `pageSize: 200`, `defaultPageSize: 200` and `defaultPageSize = 200` all open a grid.
	const OPENING_SIZE = /\b(?:default)?[pP]ageSize\s*[:=]\s*(\d+)/g;

	const oversized = sources.flatMap(({ file, source }) =>
		[...source.matchAll(OPENING_SIZE)]
			.filter((match) => Number(match[1]) > MAX_DEFAULT_PAGE_SIZE)
			.map((match) => `${file}: ${match[0]}`),
	);

	it("finds the literal page sizes it is checking", () => {
		const checked = sources.filter(
			({ source }) => source.match(OPENING_SIZE) !== null,
		);
		expect(checked.length).toBeGreaterThan(10);
	});

	it("has none above the ceiling", () => {
		expect(oversized).toEqual([]);
	});

	it("takes the options from PAGE_SIZE_OPTIONS everywhere", () => {
		const literalOptions = sources
			.filter(({ source }) => /pageSizeOptions=\{\[/.test(source))
			.map(({ file }) => file);
		expect(literalOptions).toEqual([]);
	});
});
