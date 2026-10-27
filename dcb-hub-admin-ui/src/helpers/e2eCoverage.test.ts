import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import criteria from "../../scripts/wcag-criteria.json";
import { catalogue } from "../../scripts/release-report";

interface ListedSpec {
	file: string;
	title: string;
	tags: string[];
	tests: { annotations: { type: string; description?: string }[] }[];
}
interface ListedSuite {
	specs?: ListedSpec[];
	suites?: ListedSuite[];
}

/** Every e2e test as `playwright test --list` reports it, which needs no browser and no server. */
function listSpecs(): ListedSpec[] {
	const cli = join("node_modules", "@playwright", "test", "cli.js");
	const output = execFileSync(
		process.execPath,
		[cli, "test", "--list", "--reporter=json"],
		{ encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
	);
	const specs: ListedSpec[] = [];
	const walk = (suite: ListedSuite) => {
		specs.push(...(suite.specs ?? []));
		suite.suites?.forEach(walk);
	};
	(JSON.parse(output) as { suites: ListedSuite[] }).suites.forEach(walk);
	return specs;
}

const coversOf = (spec: ListedSpec) =>
	spec.tests[0]?.annotations.find((annotation) => annotation.type === "covers")
		?.description;

const name = (spec: ListedSpec) => `${spec.file}: ${spec.title}`;

/** The release report explains each accessibility test in its own words; these keep it able to. */
describe("accessibility test coverage", () => {
	let specs: ListedSpec[] = [];
	beforeAll(() => {
		specs = listSpecs();
	}, 120_000);

	it("finds the e2e suite", () => {
		expect(specs.length).toBeGreaterThan(100);
	});

	it("says what every accessibility test covers", () => {
		const tagged = specs.filter((spec) =>
			spec.tags.some((tag) => tag === "a11y" || tag.startsWith("wcag-")),
		);
		expect(tagged.filter((spec) => !coversOf(spec)?.trim()).map(name)).toEqual(
			[],
		);
	});

	it("names only WCAG criteria that exist", () => {
		const unknown = specs.flatMap((spec) =>
			spec.tags
				.filter((tag) => tag.startsWith("wcag-"))
				.map((tag) => tag.slice("wcag-".length))
				.filter((criterion) => !(criterion in criteria))
				.map((criterion) => `${name(spec)} names ${criterion}`),
		);
		expect(unknown).toEqual([]);
	});

	it("tags every test in the accessibility suite", () => {
		const suite = specs.filter((spec) => spec.file === "accessibility.spec.ts");
		expect(suite.length).toBeGreaterThan(50);
		expect(
			suite.filter((spec) => !spec.tags.includes("a11y")).map(name),
		).toEqual([]);
	});

	it("places every page scan on a page and in a view", () => {
		const scans = specs.filter((spec) =>
			spec.tests[0]?.annotations.some(
				(annotation) => annotation.type === "page",
			),
		);
		expect(scans.length).toBeGreaterThan(100);
		const views = new Set(
			scans.map(
				(spec) =>
					spec.tests[0]?.annotations.find(
						(annotation) => annotation.type === "view",
					)?.description,
			),
		);
		expect([...views].sort()).toEqual(["dark", "high contrast", "light"]);
	});
});

/** Browser tests evidence a requirement through proves(); these keep the tags and the catalogue agreed. */
describe("requirement tags", () => {
	let specs: ListedSpec[] = [];
	beforeAll(() => {
		specs = listSpecs();
	}, 120_000);

	const tagged = (id: string) =>
		specs.filter((spec) => spec.tags.includes(`req-${id}`));

	it("names only requirements the catalogue has, and only ones it says browser tests evidence", () => {
		const wrong = specs.flatMap((spec) =>
			spec.tags
				.filter((tag) => tag.startsWith("req-"))
				.map((tag) => tag.slice("req-".length))
				.filter((id) => !catalogue[id]?.e2e)
				.map((id) => `${name(spec)} names ${id}`),
		);
		expect(wrong).toEqual([]);
	});

	it("finds a browser test for every requirement that says browser tests evidence it", () => {
		const untested = Object.entries(catalogue)
			.filter(([id, requirement]) => requirement.e2e && tagged(id).length === 0)
			.map(([id]) => id);
		expect(untested).toEqual([]);
	});

	it("says what every test tagged with a requirement proves", () => {
		const unexplained = specs
			.filter(
				(spec) =>
					spec.tags.some((tag) => tag.startsWith("req-")) &&
					!coversOf(spec)?.trim(),
			)
			.map(name);
		expect(unexplained).toEqual([]);
	});
});
