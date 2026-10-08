import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import {
	DETAIL_REFETCH_MS,
	detailRefetchInterval,
} from "@constants/refetchIntervals";

describe("detailRefetchInterval", () => {
	it("polls a page nobody is editing", () => {
		expect(detailRefetchInterval(false)).toBe(DETAIL_REFETCH_MS);
	});

	it("stops while a form is being edited", () => {
		expect(detailRefetchInterval(true)).toBe(false);
	});
});

/**
 * A page that feeds react-hook-form through `values` and polls must pause while editing.
 *
 * The constant states this in prose and names the three pages that follow it. That list
 * had drifted: `locations/$locationId` polled on the raw interval, so a refetch landing
 * mid-edit replaced the field being typed into.
 */
describe("every values-fed form pauses its poll while editing", () => {
	const repoRoot = process.cwd();
	const read = (file: string) =>
		readFileSync(path.resolve(repoRoot, file), "utf8");

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

	// `values:` inside a useForm call is the reactive-values mode - the one that
	// re-syncs the form when the data changes, and so the one a poll can overwrite.
	const VALUES_FED = /useForm[\s\S]{0,1200}?^\t\tvalues: \{/m;
	const POLLS = /refetchInterval:/;
	const GUARDED = /refetchInterval:\s*detailRefetchInterval\(/;

	const pages = [
		...sourcesUnder("src/routes"),
		...sourcesUnder("src/components"),
	]
		.map((file) => ({ file, source: read(file) }))
		.filter(({ source }) => VALUES_FED.test(source) && POLLS.test(source));

	it("finds the pages", () => {
		expect(pages.length).toBeGreaterThan(2);
	});

	it.each(pages.map(({ file }) => file))(
		"%s polls through detailRefetchInterval",
		(file) => {
			expect(
				GUARDED.test(read(file)),
				`${file} feeds react-hook-form through \`values\` and polls on a fixed ` +
					`interval. A refetch that lands mid-edit replaces the field being ` +
					`typed into. Pass detailRefetchInterval(editMode).`,
			).toBe(true);
		},
	);
});
