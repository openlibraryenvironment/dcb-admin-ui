import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

/**
 * `expose_as` accepts only letters, digits, hyphens, underscores and spaces.
 * GitLab rejects anything else when it CREATES the pipeline, not when it parses
 * the file - so valid YAML tells you nothing about it.
 *
 * What it cost and why the text is read raw: docs/testing.md, "Valid YAML is not
 * a valid pipeline".
 */
const ciConfig = readFileSync(
	resolve(__dirname, "../../../.gitlab-ci.yml"),
	"utf8",
);

/** Per GitLab: letters, digits, '-', '_' and spaces, and at most 128 characters. */
const ALLOWED = /^[A-Za-z0-9 _-]+$/;
const MAX_LENGTH = 128;

const exposeAsValues = [
	...ciConfig.matchAll(/^\s*expose_as:\s*["']?(.*?)["']?\s*$/gm),
].map((match) => match[1]);

describe("expose_as in .gitlab-ci.yml", () => {
	it("has values to check", () => {
		// A regex that stopped matching would pass every assertion below vacuously.
		expect(exposeAsValues.length).toBeGreaterThan(0);
	});

	it.each(exposeAsValues)(
		"%s uses only the characters GitLab allows",
		(value) => {
			expect(value).toMatch(ALLOWED);
		},
	);

	it.each(exposeAsValues)("%s is within GitLab's length limit", (value) => {
		expect(value.length).toBeLessThanOrEqual(MAX_LENGTH);
	});

	it("is set only on jobs that also keep artifact paths", () => {
		// GitLab requires `artifacts:paths` alongside `expose_as`; without it the link has
		// nothing to point at and the pipeline is rejected for that instead.
		const blocks = ciConfig.split(/^\S/m);
		const exposing = blocks.filter((block) => block.includes("expose_as:"));

		expect(exposing.length).toBe(exposeAsValues.length);
		for (const block of exposing) {
			expect(block).toContain("paths:");
		}
	});
});

/** Every job runs on the ki-onprem runner and nothing else: docs/testing.md, "Where the pipeline runs". */
describe("the runner every job runs on", () => {
	const RUNNER = "ki-onprem";
	const lines = ciConfig.split("\n");

	/** Each `tags:` key, with the list under it or beside it */
	const tagLists = lines.flatMap((line, index) => {
		const key = /^(\s*)tags:\s*(.*)$/.exec(line);
		if (!key) return [];
		const [, indent, inline] = key;
		if (inline.trim()) {
			const items = inline
				.replace(/[[\]]/g, "")
				.split(",")
				.map((item) => item.trim());
			return [{ line: index + 1, items: items.filter(Boolean) }];
		}
		const items: string[] = [];
		for (const next of lines.slice(index + 1)) {
			const item = /^(\s*)-\s+(\S+)\s*$/.exec(next);
			if (!item || item[1].length < indent.length) break;
			items.push(item[2]);
		}
		return [{ line: index + 1, items }];
	});

	it("is the default for every job", () => {
		const defaults = ciConfig
			.split(/^(?=\S)/m)
			.find((block) => block.startsWith("default:"));
		expect(defaults).toMatch(
			new RegExp(String.raw`\n\s+tags:\n\s+- ${RUNNER}\n`),
		);
	});

	it("is the only runner any job names", () => {
		expect(tagLists.length).toBeGreaterThan(0);
		const elsewhere = tagLists.filter(
			({ items }) => items.length !== 1 || items[0] !== RUNNER,
		);
		expect(elsewhere).toEqual([]);
	});

	it("cannot be dropped by a job opting out of the defaults", () => {
		expect(ciConfig).not.toMatch(/^\s+inherit:/m);
	});
});
