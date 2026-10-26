import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ci = readFileSync(resolve(__dirname, "../../.gitlab-ci.yml"), "utf8");

/** Each top-level job and its text, up to the next top-level key. */
const jobs = [
	...ci.matchAll(/^([a-z_][a-z0-9_]*):\n((?:(?:[ #].*)?\n)*)/gm),
].map(([, name, body]) => ({ name, body }));

const SHIPPING_STAGES =
	/^\s+stage: (build|release|rebuild|container|deploy)\s*$/m;

/** An on-demand report run ships nothing: docs/testing.md, "The report on demand". */
describe("a pipeline run on demand for the release report", () => {
	const shipping = jobs.filter(
		({ body }) =>
			SHIPPING_STAGES.test(body) ||
			/^\s+extends: \.publish_image\s*$/m.test(body),
	);

	it("finds the jobs that build, release, publish or deploy", () => {
		expect(shipping.map(({ name }) => name)).toEqual(
			expect.arrayContaining([
				"build",
				"release",
				"publish_image_next",
				"deploy_release_to_r2",
			]),
		);
	});

	it("runs none of them", () => {
		expect(
			shipping
				.filter(({ body }) => !body.includes('$ON_DEMAND_REPORT != "true"'))
				.map(({ name }) => name),
		).toEqual([]);
	});

	it("runs every check and the report", () => {
		const rules = ci.split("\n.rules:\n")[1]?.split("\n\n")[0] ?? "";
		for (const ruleSet of ["gate", "app"]) {
			const block =
				rules.split(`  ${ruleSet}:\n`)[1]?.split(/\n {2}[a-z]+:\n/)[0] ?? "";
			expect(
				block.trimStart().startsWith('- if: $ON_DEMAND_REPORT == "true"'),
				ruleSet,
			).toBe(true);
		}
	});
});
