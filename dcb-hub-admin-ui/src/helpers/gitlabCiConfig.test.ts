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
