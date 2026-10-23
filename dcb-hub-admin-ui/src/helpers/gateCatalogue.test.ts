import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import gates from "../../scripts/gates.json";

/** The pipeline's checks, read from the top-level job names in .gitlab-ci.yml. */
const verifyJobs = [
	...readFileSync(
		resolve(__dirname, "../../../.gitlab-ci.yml"),
		"utf8",
	).matchAll(/^(verify_[a-z0-9_]+):\s*$/gm),
].map((match) => match[1]);

/** The release report explains every check the pipeline runs; these keep it able to. */
describe("gate catalogue", () => {
	it("finds the pipeline's checks", () => {
		expect(verifyJobs.length).toBeGreaterThan(5);
	});

	it("explains every check the pipeline runs, and no other", () => {
		expect(Object.keys(gates).sort()).toEqual([...verifyJobs].sort());
	});

	it("says what each check does and why it matters", () => {
		const incomplete = Object.entries(gates)
			.filter(
				([, gate]) =>
					!gate.title.trim() || !gate.checks.trim() || !gate.matters.trim(),
			)
			.map(([job]) => job);
		expect(incomplete).toEqual([]);
	});
});
