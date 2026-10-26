import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
	accessibility,
	e2eTests,
	gateResults,
	junitCounts,
	attention,
	enClause,
	evaluate,
	figures,
	render,
	reportData,
	requirementResults,
	unitCases,
	verdict,
	vpatConformance,
	type E2ETest,
	type Inputs,
} from "../../scripts/release-report";

const axe = (rules: object[]) =>
	Buffer.from(JSON.stringify(rules)).toString("base64");

const playwrightReport = {
	suites: [
		{
			suites: [
				{
					specs: [
						{
							file: "accessibility.spec.ts",
							title: "/libraries has no violations",
							tags: ["a11y"],
							tests: [
								{
									projectName: "narrow",
									status: "expected" as const,
									annotations: [
										{
											type: "covers",
											description:
												"Every check axe can automate passes on /libraries, in light mode.",
										},
										{ type: "page", description: "/libraries" },
										{ type: "view", description: "light" },
									],
									results: [
										{
											attachments: [
												{
													name: "axe",
													body: axe([
														{
															id: "color-contrast",
															help: "Contrast",
															outcome: "passed",
															criteria: ["1.4.3"],
														},
													]),
												},
											],
										},
									],
								},
							],
						},
					],
				},
			],
			specs: [
				{
					file: "display-preferences.spec.ts",
					title: "scales the root and the headings with it",
					tags: ["a11y", "wcag-1.4.4"],
					tests: [
						{
							projectName: "chromium",
							status: "flaky" as const,
							annotations: [
								{
									type: "covers",
									description: "Choosing a larger text size enlarges the text.",
								},
							],
							results: [{ attachments: [] }, { attachments: [] }],
						},
					],
				},
			],
		},
	],
};

const scan = (
	page: string,
	view: string,
	outcome: E2ETest["outcome"],
	ruleOutcome: "passed" | "failed",
	project = "chromium",
): E2ETest => ({
	file: "accessibility.spec.ts",
	title: `${page} ${view} ${project}`,
	tags: ["a11y"],
	page,
	view,
	project,
	outcome,
	axe: [
		{
			id: "color-contrast",
			help: "Contrast",
			outcome: ruleOutcome,
			criteria: ["1.4.3"],
		},
	],
});

const inputs = (overrides: Partial<Inputs> = {}): Inputs => ({
	statuses: {},
	junit: {},
	vpat: new Map(),
	pipeline: { when: new Date("2026-10-23T12:00:00Z") },
	...overrides,
});

describe("junitCounts", () => {
	it("reads Playwright's counts from the root element", () => {
		const xml = `<testsuites id="" name="" tests="10" failures="1" skipped="2" errors="1" time="3">`;
		expect(junitCounts(xml)).toEqual({
			tests: 10,
			failed: 2,
			skipped: 2,
			passed: 6,
		});
	});

	it("counts skipped tests where Vitest leaves the attribute out", () => {
		const xml = `<testsuites name="vitest tests" tests="3" failures="0" errors="0"><testcase><skipped/></testcase></testsuites>`;
		expect(junitCounts(xml)).toEqual({
			tests: 3,
			failed: 0,
			skipped: 1,
			passed: 2,
		});
	});
});

describe("e2eTests", () => {
	const tests = e2eTests(playwrightReport);

	it("finds tests at every depth, with what they cover, where they looked and in which project", () => {
		expect(
			tests.map((test) => [
				test.title,
				test.outcome,
				test.page,
				test.view,
				test.project,
			]),
		).toEqual([
			[
				"scales the root and the headings with it",
				"flaky",
				undefined,
				undefined,
				"chromium",
			],
			[
				"/libraries has no violations",
				"passed",
				"/libraries",
				"light",
				"narrow",
			],
		]);
		expect(tests[0].covers).toBe(
			"Choosing a larger text size enlarges the text.",
		);
	});

	it("decodes what axe found from the test's attachment", () => {
		expect(tests[1].axe).toEqual([
			{
				id: "color-contrast",
				help: "Contrast",
				outcome: "passed",
				criteria: ["1.4.3"],
			},
		]);
	});
});

describe("vpatConformance", () => {
	const vpat = vpatConformance(readFileSync("docs/DCB_Admin_VPAT.md", "utf8"));

	it("reads the stated conformance of each criterion from the VPAT", () => {
		expect(vpat.get("1.4.10")).toBe("Supports");
		expect(vpat.get("1.2.4")).toBe("Not applicable");
		expect(vpat.get("3.2.5")).toBe("Partially supports");
	});

	it("finds every criterion the VPAT states", () => {
		expect(vpat.size).toBeGreaterThan(80);
	});
});

describe("accessibility", () => {
	const model = accessibility(
		[
			scan("/libraries", "light", "passed", "passed"),
			scan("/libraries", "high contrast", "passed", "passed"),
			scan("/libraries", "light", "passed", "passed", "narrow"),
			scan("/libraries", "dark", "failed", "failed", "narrow"),
			{
				file: "display-preferences.spec.ts",
				title: "text size",
				tags: ["a11y", "wcag-1.4.4"],
				covers: "Text size.",
				outcome: "passed",
				axe: [],
			},
			{
				file: "other.spec.ts",
				title: "not accessibility",
				tags: [],
				outcome: "failed",
				axe: [],
			},
		],
		new Map([["3.3.8", "Supports"]]),
	);
	const row = (id: string) =>
		model.criteria.find((criterion) => criterion.id === id);

	it("places each scan by page and view, with phone width from the 320px project", () => {
		expect(model.matrix).toEqual([
			{
				page: "/libraries",
				cells: ["passed", undefined, "passed", "failed"],
			},
		]);
		expect(model.problems).toBe(1);
	});

	it("says how each criterion was checked, and what was found", () => {
		expect(row("1.4.3")).toMatchObject({
			scans: { checked: 4, failed: 1 },
			result: "failed",
		});
		expect(row("1.4.4")?.result).toBe("passed");
		expect(row("3.3.8")).toMatchObject({
			result: "by hand",
			handAssessed: "Supports",
		});
	});

	it("lists a test once though the 320px project ran it again, failed if either run failed", () => {
		const twice = accessibility(
			[
				{
					file: "a.spec.ts",
					title: "skip link",
					tags: ["a11y"],
					covers: "Skip.",
					project: "chromium",
					outcome: "passed",
					axe: [],
				},
				{
					file: "a.spec.ts",
					title: "skip link",
					tags: ["a11y"],
					covers: "Skip.",
					project: "narrow",
					outcome: "failed",
					axe: [],
				},
			],
			new Map(),
		);
		expect(twice.others.map((test) => test.outcome)).toEqual(["failed"]);
	});

	it("lists every A and AA criterion WCAG 2.2 has, and not the one it removed", () => {
		expect(model.criteria).toHaveLength(55);
		expect(row("4.1.1")).toBeUndefined();
	});
});

describe("gateResults and verdict", () => {
	it("explains every check, and says which did not run", () => {
		const results = gateResults(
			inputs({
				statuses: { verify_quality: "success", verify_e2e: "failed" },
			}),
		);
		const outcome = (job: string) =>
			results.find((result) => result.job === job)?.outcome;
		expect(outcome("verify_quality")).toBe("passed");
		expect(outcome("verify_e2e")).toBe("failed");
		expect(outcome("verify_container")).toBe("not run");
		expect(verdict(results)).toBe(`1 of ${results.length} checks failed.`);
	});

	it("says so when no check recorded a result, as on a laptop", () => {
		expect(verdict(gateResults(inputs()))).toBe(
			"No check recorded a result in this pipeline.",
		);
	});

	it("does not call a pipeline clean when checks did not run", () => {
		const results = gateResults(
			inputs({ statuses: { verify_quality: "success" } }),
		);
		expect(verdict(results)).toMatch(
			/^Every check that ran passed\. \d+ of \d+ did not run/,
		);
	});

	it("reports the base-path and bootloader suites as the one job they run in", () => {
		const results = gateResults(
			inputs({
				junit: {
					basePath: { tests: 15, passed: 15, failed: 0, skipped: 0 },
					kiBootstrap: { tests: 3, passed: 2, failed: 1, skipped: 0 },
				},
			}),
		);
		expect(
			results.find((result) => result.job === "verify_base_path")?.detail,
		).toBe("1 of 18 browser tests failed.");
	});
});

describe("render", () => {
	it("escapes what it is given, so a test title cannot inject markup", () => {
		const html = render(
			inputs({
				e2e: [
					{
						file: "x.spec.ts",
						title: "<script>alert(1)</script>",
						tags: [],
						outcome: "failed",
						axe: [],
					},
				],
			}),
		);
		expect(html).not.toContain("<script>");
		expect(html).toContain("&lt;script&gt;");
	});

	it("reports evidence for a criterion, and takes its conformance only from the VPAT", () => {
		const html = render(
			inputs({
				e2e: [scan("/libraries", "light", "passed", "passed")],
				vpat: new Map([["1.4.3", "Partially supports"]]),
			}),
		);
		const contrast = html
			.split("1.4.3 Contrast (Minimum)")[1]
			.split("</tr>")[0];
		expect(contrast).toContain("no problems found");
		expect(contrast).toContain("Partially supports");
		expect(contrast).not.toContain("Passed");
	});

	it("reports Lighthouse for each page it audited", () => {
		const html = render(
			inputs({
				lighthouse: {
					pages: [
						{ page: "/login", scores: { accessibility: 100 } },
						{ page: "/consortium/insights", scores: { accessibility: 100 } },
					],
					failures: [],
				},
			}),
		);
		expect(html).toContain("Google Lighthouse, on /login");
		expect(html).toContain("Google Lighthouse, on /consortium/insights");
	});

	it("names the tag and says so when it was run on demand", () => {
		const html = render(
			inputs({
				pipeline: {
					tag: "v2.2.0",
					onDemand: true,
					commit: "abc1234",
					when: new Date("2026-10-23T12:00:00Z"),
				},
			}),
		);
		expect(html).toContain("released as v2.2.0");
		expect(html).toContain("Run on demand. Nothing was released or deployed");
		expect(
			render(inputs({ pipeline: { ref: "release", when: new Date() } })),
		).not.toContain("Run on demand");
	});

	it("is one document with a language and a single main heading", () => {
		const html = render(inputs());
		expect(html).toMatch(/^<!doctype html>\n<html lang="en">/);
		expect(html.match(/<h1>/g)).toHaveLength(1);
	});
});

describe("unitCases", () => {
	it("reads each case from Vitest's JUnit, unescaped, with its outcome", () => {
		const xml = `<testsuite name="a.test.ts">
<testcase classname="src/a.test.ts" name="the container&apos;s headers &gt; are set" time="0.1">
</testcase>
<testcase classname="src/a.test.ts" name="the container&apos;s headers &gt; fail" time="0.1"><failure message="no"/></testcase>
<testcase classname="src/a.test.ts" name="x &gt; skipped" time="0"><skipped/></testcase>
</testsuite>`;
		expect(unitCases(xml)).toEqual([
			{
				file: "src/a.test.ts",
				name: "the container's headers > are set",
				outcome: "passed",
			},
			{
				file: "src/a.test.ts",
				name: "the container's headers > fail",
				outcome: "failed",
			},
			{ file: "src/a.test.ts", name: "x > skipped", outcome: "skipped" },
		]);
	});
});

describe("evaluate", () => {
	const context = (
		outcomes: Record<string, "passed" | "failed" | "not run">,
		extra: Partial<Parameters<typeof evaluate>[1]> = {},
	): Parameters<typeof evaluate>[1] => ({
		checkOutcome: (job) => outcomes[job] ?? "not run",
		checkTitle: (job) => job,
		today: new Date("2026-10-23T12:00:00Z"),
		...extra,
	});
	const result = (
		requirement: Parameters<typeof evaluate>[0][string],
		ctx: Parameters<typeof evaluate>[1],
	) => evaluate({ "SEC-09": requirement }, ctx)[0];
	const base = {
		category: "Security" as const,
		requirement: "Something true.",
	};

	it("passes a requirement only when all of its automated evidence ran and passed", () => {
		const both = { ...base, checks: ["a", "b"] };
		expect(result(both, context({ a: "passed", b: "passed" })).result).toBe(
			"passed",
		);
		expect(result(both, context({ a: "passed", b: "failed" })).result).toBe(
			"failed",
		);
		expect(result(both, context({ a: "passed" })).result).toBe("partly run");
		expect(result(both, context({})).result).toBe("not run");
	});

	it("counts the browser tests tagged with it, once each, and the unit tests in its describe blocks", () => {
		const row = result(
			{
				...base,
				e2e: true,
				unit: [{ file: "src/a.test.ts", describe: "headers" }],
			},
			context(
				{},
				{
					e2e: [
						{
							file: "a.spec.ts",
							title: "t",
							tags: ["req-SEC-09"],
							outcome: "passed",
						},
						{
							file: "a.spec.ts",
							title: "t",
							tags: ["req-SEC-09"],
							outcome: "failed",
						},
						{
							file: "b.spec.ts",
							title: "u",
							tags: ["req-SEC-01"],
							outcome: "failed",
						},
					],
					unit: [
						{
							file: "src/a.test.ts",
							name: "headers > are set",
							outcome: "passed",
						},
						{
							file: "src/a.test.ts",
							name: "headersless > other",
							outcome: "failed",
						},
					],
				},
			),
		);
		expect(
			row.evidence.map((item) => [item.kind, item.outcome, item.detail]),
		).toEqual([
			["browser tests", "failed", "1 of 1 browser tests failed."],
			["unit tests", "passed", "1 unit tests passed."],
		]);
		expect(row.result).toBe("failed");
	});

	it("counts two tests that share a title in different describe blocks as two", () => {
		const row = result(
			{ ...base, e2e: true },
			context(
				{},
				{
					e2e: [
						{
							file: "a.spec.ts",
							describe: "checkout",
							title: "t",
							tags: ["req-SEC-09"],
							outcome: "passed",
						},
						{
							file: "a.spec.ts",
							describe: "walk-up",
							title: "t",
							tags: ["req-SEC-09"],
							outcome: "passed",
						},
					],
				},
			),
		);
		expect(row.evidence[0].detail).toBe("2 browser tests passed.");
	});

	it("reports a statement as assessed by hand, and says when it is due for review", () => {
		const statement = (reviewed: string) =>
			result(
				{ ...base, statement: { text: "We say so.", reviewed } },
				context({}),
			);
		expect(statement("2026-06-01")).toMatchObject({
			result: "by hand",
			stale: false,
		});
		expect(statement("2025-09-01")).toMatchObject({
			result: "by hand",
			stale: true,
		});
		expect(statement("2025-09-01").evidence[0].detail).toContain(
			"due for review",
		);
	});
});

describe("requirementResults and reportData", () => {
	it("takes the accessibility requirement's result from the WCAG section", () => {
		const rows = requirementResults(
			inputs({
				statuses: { verify_e2e: "success" },
				e2e: [scan("/libraries", "light", "passed", "failed")],
				catalogue: {
					"ACC-01": {
						category: "Accessibility",
						requirement: "AA.",
						checks: ["verify_e2e"],
						accessibility: "wcag22aa",
					},
				},
			}),
		);
		expect(rows[0].result).toBe("failed");
		expect(rows[0].evidence[1]).toMatchObject({
			kind: "accessibility",
			outcome: "failed",
		});
	});

	it("writes every requirement in the shipped catalogue into the report's data", () => {
		const data = reportData(inputs());
		expect(data.requirements.length).toBeGreaterThan(10);
		expect(
			data.requirements.every(
				(row) => row.result === "not run" || row.result === "by hand",
			),
		).toBe(true);
		expect(data.pipeline.when).toBe("2026-10-23T12:00:00.000Z");
	});

	it("puts the requirements before the checks on the page", () => {
		const html = render(inputs());
		expect(html.indexOf("<h2>Requirements</h2>")).toBeGreaterThan(0);
		expect(html.indexOf("<h2>Requirements</h2>")).toBeLessThan(
			html.indexOf("<h2>Checks</h2>"),
		);
	});
});

describe("needs attention", () => {
	const when = new Date("2026-10-23T12:00:00Z");
	const items = (overrides: Partial<Inputs>) =>
		attention(inputs({ pipeline: { when }, ...overrides }));

	it("says nothing when nothing needs attention", () => {
		expect(items({})).toEqual([]);
	});

	it("flags a manual evaluation and a VPAT more than six months old, and a VPAT older than the build", () => {
		const found = items({
			version: "v2.3.0",
			vpatFacts: {
				version: "v2.2.0",
				updated: "2026-03-01",
				manual: { version: "v1.58.0", date: "2026-03-01" },
				gaps: [],
			},
		});
		expect(found).toEqual([
			expect.stringContaining("last updated on 2026-03-01"),
			expect.stringContaining(
				"describes v2.2.0, which is older than this build, v2.3.0",
			),
			expect.stringContaining(
				"manual accessibility evaluation was last carried out for v1.58.0, in March 2026",
			),
		]);
	});

	it("flags a missing licence declaration, a moving base image and an incomplete translation", () => {
		const found = items({
			security: {
				headers: [],
				product: { title: "Functional Source License, Version 1.1" },
			},
			image: {
				base: { image: "nginx:stable-alpine", pinned: false },
				tags: [],
			},
			languages: [
				{
					code: "en-GB",
					name: "English (United Kingdom)",
					kind: "source",
					strings: 100,
					translated: 100,
					obsolete: 0,
				},
				{
					code: "en-US",
					name: "English (United States)",
					kind: "overlay",
					strings: 5,
					translated: 5,
					obsolete: 0,
				},
				{
					code: "es",
					name: "Spanish",
					kind: "translation",
					strings: 43,
					translated: 43,
					obsolete: 0,
				},
			],
		});
		expect(found).toEqual([
			expect.stringContaining("package.json declares no licence"),
			expect.stringContaining("nginx:stable-alpine, a tag that moves"),
			"Spanish is offered, but 43% of the interface is translated. The rest shows in British English.",
		]);
	});

	it("flags tests that passed only on retry, and a nightly flake hunt that failed", () => {
		const found = items({
			e2e: [
				{ file: "a.spec.ts", title: "t", tags: [], outcome: "flaky", axe: [] },
			],
			nightly: [
				{ file: "a.spec.ts", name: "t", outcome: "failed" },
				{ file: "a.spec.ts", name: "t", outcome: "passed" },
			],
		});
		expect(found).toEqual([
			"A browser test passed only on a second try.",
			"The last nightly flake hunt failed a test.",
		]);
	});
});

describe("figures", () => {
	it("carries the numbers worth comparing with the last release", () => {
		const labels = figures(
			inputs({
				junit: { unit: { tests: 10, passed: 10, failed: 0, skipped: 0 } },
				budget: {
					firstLoad: { size: 338_014, budget: 344_800 },
					routes: [],
					onDemand: [],
				},
				security: {
					headers: [],
					npm: { critical: 1, high: 2, moderate: 0, low: 0, info: 0 },
				},
			}),
		);
		expect(labels).toEqual(
			expect.arrayContaining([
				{ label: "What every page loads first, KB", value: 330 },
				{ label: "Unit tests", value: 10 },
				{ label: "High or critical advisories in shipped libraries", value: 3 },
			]),
		);
	});
});

describe("the new sections", () => {
	it("reads what the storage test attached", () => {
		const tests = e2eTests({
			suites: [
				{
					specs: [
						{
							file: "requesting.spec.ts",
							title: "storage",
							tags: ["req-PRIV-02"],
							tests: [
								{
									projectName: "chromium",
									status: "expected",
									annotations: [],
									results: [
										{
											attachments: [
												{
													name: "storage",
													body: Buffer.from(
														JSON.stringify({
															local: ["a"],
															session: [],
															cookies: [],
														}),
													).toString("base64"),
												},
											],
										},
									],
								},
							],
						},
					],
				},
			],
		});
		expect(tests[0].storage).toEqual({
			local: ["a"],
			session: [],
			cookies: [],
		});
	});

	it("numbers a web criterion as EN 301 549 does, and has no clause for one new in WCAG 2.2", () => {
		expect(enClause("1.4.3")).toBe("9.1.4.3");
		expect(enClause("2.5.8")).toBeUndefined();
	});

	it("shows each requirement's Secure by Design principles", () => {
		const html = render(
			inputs({
				catalogue: {
					"SEC-09": {
						category: "Security",
						requirement: "Something.",
						checks: ["verify_secrets"],
						standards: { sbd: ["9"] },
					},
				},
			}),
		);
		expect(html).toContain("9. Embed continuous assurance");
	});

	it("follows the agreed order, and says the SBOMs follow the policy", () => {
		const html = render(
			inputs({
				compatibility: {
					schemas: ["9.2.0"],
					features: [{ id: "x", name: "X", flag: "VITE_X", since: "9.2.0" }],
					deploymentFlags: [],
				},
				security: { headers: [] },
				languages: [
					{
						code: "en-GB",
						name: "English (United Kingdom)",
						kind: "source",
						strings: 1,
						translated: 1,
						obsolete: 0,
					},
				],
				e2e: [
					{
						file: "a.spec.ts",
						title: "t",
						tags: [],
						project: "chromium",
						outcome: "passed",
						axe: [],
					},
				],
			}),
		);
		const order = [
			"Requirements",
			"Compatibility",
			"What changed",
			"Accessibility: WCAG 2.2 level AA",
			"Security",
			"Privacy",
			"Browser support",
			"Languages",
			"Test reliability",
			"Checks",
		];
		const positions = order.map((heading) =>
			html.indexOf(`<h2>${heading}</h2>`),
		);
		expect(positions.every((position) => position > 0)).toBe(true);
		expect([...positions].sort((a, b) => a - b)).toEqual(positions);
		expect(html).toContain(
			"will be added to this report once the organisation's SBOM policy is agreed",
		);
	});
});
