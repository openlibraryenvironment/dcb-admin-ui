// The release report: what every check in a pipeline found, written for someone who does not
// read code. What it reads, and where it is published: docs/testing.md, "The release report".
//
// Usage: npm run report    reads reports/ and .lighthouseci/, writes reports/release-report.html
import {
	existsSync,
	mkdirSync,
	readFileSync,
	readdirSync,
	writeFileSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import type { AxeRuleOutcome } from "../e2e/fixtures/axe";
import gates from "./gates.json" with { type: "json" };
import wcag from "./wcag-criteria.json" with { type: "json" };
import catalogueJson from "./requirements.json" with { type: "json" };
import {
	LANGUAGE_NAMES,
	PROJECT_BROWSERS,
	SEVERITIES,
	capabilitiesFrom,
	compareVersions,
	deploymentFlagsFrom,
	language,
	monthsBetween,
	npmAdvisories,
	offeredLanguages,
	previousTag,
	productLicence,
	publishedTags,
	releaseNotes,
	runtimeBase,
	schemaVersions,
	secretFindings,
	securityHeaders,
	vpatFacts,
	type Feature,
	type Language,
	type Licences,
	type ReleaseNotes,
	type Severity,
	type VpatFacts,
} from "./report-facts.ts";

// ── The requirement catalogue, and the evidence for each: docs/testing.md, "The requirement catalogue"

export const CATEGORIES = {
	QUA: "Quality",
	ACC: "Accessibility",
	PERF: "Performance",
	SEC: "Security",
	PRIV: "Privacy",
	OPS: "Operations",
} as const;

export interface Requirement {
	category: (typeof CATEGORIES)[keyof typeof CATEGORIES];
	/** One sentence a buyer can read */
	requirement: string;
	/** Pipeline checks, by job name in scripts/gates.json */
	checks?: string[];
	/** Browser tests tagged with this requirement through proves() */
	e2e?: boolean;
	/** Unit tests, by file and describe block */
	unit?: { file: string; describe: string }[];
	/** Evidenced by the report's own WCAG 2.2 AA section */
	accessibility?: "wcag22aa";
	/** Assessed by hand: what is true, and when someone last checked it was */
	statement?: { text: string; reviewed: string };
	/** Clauses of other standards this requirement answers, such as Secure by Design principles */
	standards?: Record<string, string[]>;
}

export type Catalogue = Record<string, Requirement>;
export const catalogue = catalogueJson as Catalogue;

/** A statement older than this is reported as due for review, never as a pass */
export const REVIEW_MONTHS = 12;

export type EvidenceOutcome = "passed" | "failed" | "not run" | "by hand";
export type RequirementResult =
	"passed" | "failed" | "partly run" | "not run" | "by hand";

export interface Evidence {
	kind:
		"check" | "browser tests" | "unit tests" | "accessibility" | "statement";
	label: string;
	outcome: EvidenceOutcome;
	detail?: string;
}

export interface RequirementRow {
	id: string;
	category: string;
	requirement: string;
	result: RequirementResult;
	evidence: Evidence[];
	/** A statement past its review date */
	stale: boolean;
}

export interface UnitCase {
	file: string;
	/** "describe > test", as Vitest writes it */
	name: string;
	outcome: "passed" | "failed" | "skipped";
}

const XML_ENTITIES: Record<string, string> = {
	amp: "&",
	lt: "<",
	gt: ">",
	quot: '"',
	apos: "'",
};
const unescapeXml = (text: string) =>
	text.replace(
		/&(amp|lt|gt|quot|apos);/g,
		(_, entity: string) => XML_ENTITIES[entity],
	);
const attribute = (attributes: string, name: string) =>
	unescapeXml(new RegExp(`\\b${name}="([^"]*)"`).exec(attributes)?.[1] ?? "");

/** Every test case in a Vitest JUnit file. */
export function unitCases(xml: string): UnitCase[] {
	return [
		...xml.matchAll(/<testcase\b([^>]*?)(?:\/>|>([\s\S]*?)<\/testcase>)/g),
	].map(([, attributes, body = ""]) => ({
		file: attribute(attributes, "classname"),
		name: attribute(attributes, "name"),
		outcome: /<(failure|error)\b/.test(body)
			? "failed"
			: /<skipped\b/.test(body)
				? "skipped"
				: "passed",
	}));
}

interface TaggedTest {
	file: string;
	describe?: string;
	title: string;
	tags: string[];
	outcome: string;
}

export interface EvidenceContext {
	checkOutcome: (job: string) => "passed" | "failed" | "not run";
	checkTitle: (job: string) => string;
	e2e?: TaggedTest[];
	unit?: UnitCase[];
	accessibility?: { outcome: "passed" | "failed"; detail: string };
	today: Date;
}

const countedOutcomes = (
	outcomes: string[],
	noun: string,
): Pick<Evidence, "outcome" | "detail"> => {
	if (outcomes.length === 0)
		return { outcome: "not run", detail: `No ${noun} ran in this pipeline.` };
	const failed = outcomes.filter((outcome) => outcome === "failed").length;
	return failed
		? {
				outcome: "failed",
				detail: `${failed} of ${outcomes.length} ${noun} failed.`,
			}
		: { outcome: "passed", detail: `${outcomes.length} ${noun} passed.` };
};

/** One outcome per test, though the 320px project runs some a second time; a failure in either wins. */
function onePerTest(tests: TaggedTest[]): string[] {
	const outcomes = new Map<string, string>();
	for (const test of tests) {
		const key = `${test.file}\u0000${test.describe ?? ""}\u0000${test.title}`;
		if (!outcomes.has(key) || test.outcome === "failed")
			outcomes.set(key, test.outcome);
	}
	return [...outcomes.values()]
		.filter((outcome) => outcome !== "skipped")
		.map((outcome) => (outcome === "flaky" ? "passed" : outcome));
}

const monthsBefore = (date: Date, months: number) => {
	const before = new Date(date);
	before.setUTCMonth(before.getUTCMonth() - months);
	return before;
};

export function evaluate(
	requirements: Catalogue,
	context: EvidenceContext,
): RequirementRow[] {
	return Object.entries(requirements).map(([id, requirement]) => {
		const evidence: Evidence[] = [];
		for (const job of requirement.checks ?? []) {
			evidence.push({
				kind: "check",
				label: context.checkTitle(job),
				outcome: context.checkOutcome(job),
			});
		}
		if (requirement.e2e) {
			const tagged = (context.e2e ?? []).filter((test) =>
				test.tags.includes(`req-${id}`),
			);
			evidence.push({
				kind: "browser tests",
				label: "Browser tests written for it",
				...countedOutcomes(onePerTest(tagged), "browser tests"),
			});
		}
		if (requirement.unit?.length) {
			const cases = (context.unit ?? []).filter((unitCase) =>
				requirement.unit?.some(
					(ref) =>
						unitCase.file === ref.file &&
						unitCase.name.startsWith(`${ref.describe} > `),
				),
			);
			evidence.push({
				kind: "unit tests",
				label: "Unit tests written for it",
				...countedOutcomes(
					cases
						.filter((unitCase) => unitCase.outcome !== "skipped")
						.map((unitCase) => unitCase.outcome),
					"unit tests",
				),
			});
		}
		if (requirement.accessibility) {
			evidence.push({
				kind: "accessibility",
				label: "The WCAG 2.2 AA section below",
				...(context.accessibility ?? {
					outcome: "not run",
					detail: "The browser tests did not run in this pipeline.",
				}),
			});
		}
		let stale = false;
		if (requirement.statement) {
			stale =
				new Date(requirement.statement.reviewed) <
				monthsBefore(context.today, REVIEW_MONTHS);
			evidence.push({
				kind: "statement",
				label: requirement.statement.text,
				outcome: "by hand",
				detail: `Assessed by hand, last reviewed ${requirement.statement.reviewed}${stale ? ": due for review" : ""}.`,
			});
		}
		const automated = evidence
			.filter((item) => item.kind !== "statement")
			.map((item) => item.outcome);
		const result: RequirementResult =
			automated.length === 0
				? "by hand"
				: automated.includes("failed")
					? "failed"
					: automated.every((outcome) => outcome === "passed")
						? "passed"
						: automated.includes("passed")
							? "partly run"
							: "not run";
		return {
			id,
			category: requirement.category,
			requirement: requirement.requirement,
			result,
			evidence,
			stale,
		};
	});
}

// ── The report

type Outcome = "passed" | "failed" | "not run";
type TestOutcome = "passed" | "failed" | "flaky" | "skipped";

export interface Counts {
	tests: number;
	passed: number;
	failed: number;
	skipped: number;
}

export interface E2ETest {
	file: string;
	/** The describe blocks it sits in: two tests in one file can share a title */
	describe?: string;
	title: string;
	tags: string[];
	covers?: string;
	page?: string;
	view?: string;
	/** "narrow" is the 320px project, which runs the accessibility suite again at phone width */
	project?: string;
	outcome: TestOutcome;
	axe: AxeRuleOutcome[];
	/** What the browser stored, by name only: the storage test's attachment */
	storage?: StoredNames;
}

export interface StoredNames {
	local: string[];
	session: string[];
	cookies: string[];
}

export interface Budget {
	firstLoad: { size: number; budget: number };
	routes: { name: string; size: number | null; budget: number }[];
	onDemand: { name: string; size: number | null; budget: number }[];
}

export interface Lighthouse {
	pages: { page: string; scores: Record<string, number> }[];
	failures: {
		auditId: string;
		level: string;
		actual: number;
		expected: number;
	}[];
}

export interface Inputs {
	statuses: Record<string, string>;
	e2e?: E2ETest[];
	junit: Record<string, Counts | undefined>;
	/** Each unit test, from the Vitest JUnit file */
	unit?: UnitCase[];
	/** scripts/requirements.json unless a test supplies its own */
	catalogue?: Catalogue;
	budget?: Budget;
	lighthouse?: Lighthouse;
	vpat: Map<string, string>;
	/** "v2.2.0": the tag on a tag pipeline, otherwise the last version package.json was given */
	version?: string;
	compatibility?: {
		/** The dcb-service releases whose schemas are committed and checked */
		schemas: string[];
		features: (Feature & { name: string })[];
		deploymentFlags: string[];
	};
	changes?: { since?: string; notes: ReleaseNotes };
	/** The last release's report data, for the figures to compare with */
	previous?: {
		figures?: Figure[];
		pipeline?: { tag?: string; commit?: string };
	};
	vpatFacts?: VpatFacts;
	security?: {
		headers: { name: string; value: string }[];
		npm?: Record<Severity, number>;
		/** New findings from the secret scan */
		secrets?: number;
		licences?: Licences;
		product?: { title: string; declared?: string };
	};
	image?: {
		base?: { image: string; pinned: boolean };
		/** The base image's digest, recorded by the container gate */
		digest?: string;
		tags: string[];
	};
	languages?: Language[];
	/** The last nightly flake hunt's results */
	nightly?: UnitCase[];
	/** No version: on the release branch, semantic-release chooses it after this is built */
	pipeline: {
		ref?: string;
		/** Set when the report was run on demand against a released tag, which names the version */
		tag?: string;
		/** Run by hand with ON_DEMAND_REPORT, which ships nothing */
		onDemand?: boolean;
		commit?: string;
		commitUrl?: string;
		pipelineUrl?: string;
		vpatUrl?: string;
		when: Date;
	};
}

/** The counts on a JUnit file's root element. Vitest leaves out `skipped`, so it is counted. */
export function junitCounts(xml: string): Counts {
	const root = /<testsuites\b([^>]*)>/.exec(xml)?.[1] ?? "";
	const attr = (name: string) => {
		const value = new RegExp(`\\b${name}="(\\d+)"`).exec(root)?.[1];
		return value === undefined ? undefined : Number(value);
	};
	const tests = attr("tests") ?? 0;
	const failed = (attr("failures") ?? 0) + (attr("errors") ?? 0);
	const skipped = attr("skipped") ?? (xml.match(/<skipped\b/g) ?? []).length;
	return { tests, failed, skipped, passed: tests - failed - skipped };
}

interface PwSuite {
	title?: string;
	specs?: PwSpec[];
	suites?: PwSuite[];
}
interface PwSpec {
	file: string;
	title: string;
	tags: string[];
	tests: {
		projectName?: string;
		status: "expected" | "unexpected" | "flaky" | "skipped";
		annotations: { type: string; description?: string }[];
		results: { attachments: { name: string; body?: string }[] }[];
	}[];
}

const TEST_OUTCOME = {
	expected: "passed",
	unexpected: "failed",
	flaky: "flaky",
	skipped: "skipped",
} as const;

/** Every test in a Playwright JSON report, with what it covers and what axe found on its page. */
export function e2eTests(report: { suites: PwSuite[] }): E2ETest[] {
	const tests: E2ETest[] = [];
	// The top-level suites are files, so a test's describe blocks are the suites below its file
	const walk = (suite: PwSuite, describe: string[]) => {
		for (const spec of suite.specs ?? []) {
			for (const test of spec.tests) {
				const annotation = (type: string) =>
					test.annotations.find((entry) => entry.type === type)?.description;
				const last = test.results.at(-1);
				tests.push({
					file: spec.file,
					describe: describe.join(" > ") || undefined,
					title: spec.title,
					tags: spec.tags,
					covers: annotation("covers"),
					page: annotation("page"),
					view: annotation("view"),
					project: test.projectName,
					outcome: TEST_OUTCOME[test.status],
					axe: (last?.attachments ?? [])
						.filter(
							(attachment) => attachment.name === "axe" && attachment.body,
						)
						.flatMap(
							(attachment) =>
								JSON.parse(
									Buffer.from(attachment.body ?? "", "base64").toString("utf8"),
								) as AxeRuleOutcome[],
						),
					storage: (() => {
						const body = last?.attachments.find(
							(attachment) => attachment.name === "storage",
						)?.body;
						return body
							? (JSON.parse(
									Buffer.from(body, "base64").toString("utf8"),
								) as StoredNames)
							: undefined;
					})(),
				});
			}
		}
		suite.suites?.forEach((child) =>
			walk(child, [...describe, child.title ?? ""]),
		);
	};
	report.suites.forEach((file) => walk(file, []));
	return tests;
}

/**
 * The conformance the VPAT states for each criterion: "1.4.10" -> "Supports". A row opens
 * `| [**1.4.10 Reflow**](…)` or `| **[1.2.4 Captions (Live)](…)**`; the next cell is the level.
 */
export function vpatConformance(markdown: string): Map<string, string> {
	const levels = new Map<string, string>();
	for (const line of markdown.split("\n")) {
		const cells = line.split("|");
		const criterion = /^\s*(?:\[\*\*|\*\*\[)(\d+\.\d+\.\d+)/.exec(
			cells[1] ?? "",
		)?.[1];
		const level = cells[2]?.trim();
		if (criterion && level) levels.set(criterion, level);
	}
	return levels;
}

const VIEWS = ["light", "dark", "high contrast"];
const PHONE = "narrow";

/** One page at phone width: every colour scheme it was scanned in there. */
function phoneCell(scans: E2ETest[]): TestOutcome | undefined {
	if (scans.length === 0) return undefined;
	if (scans.some((scan) => scan.outcome === "failed")) return "failed";
	return scans.every(
		(scan) => scan.outcome === "passed" || scan.outcome === "flaky",
	)
		? "passed"
		: "skipped";
}

export interface CriterionRow {
	id: string;
	level: string;
	name: string;
	plain: string;
	scans: { checked: number; failed: number };
	/** What the axe rules for this criterion check, in axe's words */
	rules: string[];
	tests: E2ETest[];
	handAssessed?: string;
	result: "passed" | "failed" | "by hand";
}

export function accessibility(tests: E2ETest[], vpat: Map<string, string>) {
	const a11y = tests.filter((test) => test.tags.includes("a11y"));
	const scans = a11y.filter((test) => test.page && test.view);
	const pages = [...new Set(scans.map((scan) => scan.page as string))];
	const cell = (page: string, view: string) =>
		scans.find(
			(scan) =>
				scan.page === page && scan.view === view && scan.project !== PHONE,
		)?.outcome;
	const phone = (page: string) =>
		phoneCell(
			scans.filter((scan) => scan.page === page && scan.project === PHONE),
		);

	const failedRule = (rule: AxeRuleOutcome) => rule.outcome !== "passed";
	const row = (id: string): CriterionRow => {
		const { level, name, plain } = wcag[id as keyof typeof wcag];
		const checkedBy = scans.filter((scan) =>
			scan.axe.some((rule) => rule.criteria.includes(id)),
		);
		const failed = checkedBy.filter((scan) =>
			scan.axe.some((rule) => rule.criteria.includes(id) && failedRule(rule)),
		).length;
		const rules = [
			...new Set(
				checkedBy.flatMap((scan) =>
					scan.axe
						.filter((rule) => rule.criteria.includes(id))
						.map((rule) => rule.help),
				),
			),
		].sort();
		const own = a11y.filter((test) => test.tags.includes(`wcag-${id}`));
		const tested = checkedBy.length > 0 || own.length > 0;
		const anyFailed =
			failed > 0 || own.some((test) => test.outcome === "failed");
		return {
			id,
			level,
			name,
			plain,
			scans: { checked: checkedBy.length, failed },
			rules,
			tests: own,
			handAssessed: vpat.get(id),
			result: !tested ? "by hand" : anyFailed ? "failed" : "passed",
		};
	};
	const ids = Object.keys(wcag).filter((id) => id !== "4.1.1");
	const criteria = ids
		.filter((id) => wcag[id as keyof typeof wcag].level !== "AAA")
		.map(row);
	const beyond = ids
		.filter((id) => wcag[id as keyof typeof wcag].level === "AAA")
		.map(row)
		.filter((criterion) => criterion.result !== "by hand");
	// One entry per test, though the 320px project runs some a second time; a failure in either wins
	const others = new Map<string, E2ETest>();
	for (const test of a11y.filter((test) => !test.page)) {
		const key = `${test.file}\u0000${test.describe ?? ""}\u0000${test.title}`;
		if (!others.has(key) || test.outcome === "failed") others.set(key, test);
	}
	return {
		tests: a11y,
		others: [...others.values()],
		scans,
		pages,
		matrix: pages.map((page) => ({
			page,
			cells: [...VIEWS.map((view) => cell(page, view)), phone(page)],
		})),
		problems: scans.filter((scan) => scan.outcome === "failed").length,
		criteria,
		beyond,
	};
}

export interface GateResult {
	job: string;
	title: string;
	checks: string;
	matters: string;
	outcome: Outcome;
	detail?: string;
}

const number = (value: number) => value.toLocaleString("en-GB");
const kb = (bytes: number) => `${number(Math.round(bytes / 1024))} KB`;
const sentenceCase = (text: string) =>
	text.charAt(0).toUpperCase() + text.slice(1);
const counted = (counts: Counts | undefined, noun: string) => {
	if (!counts) return undefined;
	return counts.failed > 0
		? `${number(counts.failed)} of ${number(counts.tests)} ${noun} failed.`
		: `${number(counts.passed)} ${noun} passed${counts.skipped ? `, ${number(counts.skipped)} skipped` : ""}.`;
};

/** The base-path and bootloader suites run in one job, so they are reported as one check. */
function mounted(
	basePath: Counts | undefined,
	kiBootstrap: Counts | undefined,
) {
	if (!basePath && !kiBootstrap) return undefined;
	const sum = (key: keyof Counts) =>
		(basePath?.[key] ?? 0) + (kiBootstrap?.[key] ?? 0);
	return counted(
		{
			tests: sum("tests"),
			passed: sum("passed"),
			failed: sum("failed"),
			skipped: sum("skipped"),
		},
		"browser tests",
	);
}

export function gateResults(inputs: Inputs): GateResult[] {
	const outcome = (job: string): Outcome => {
		const status = inputs.statuses[job];
		if (status === "success" || status === "passed") return "passed";
		if (status === "failed" || status === "canceled") return "failed";
		return "not run";
	};
	const e2e = inputs.e2e;
	const flaky = e2e?.filter((test) => test.outcome === "flaky").length ?? 0;
	const details: Record<string, string | undefined> = {
		verify_quality: counted(inputs.junit.unit, "unit tests"),
		verify_e2e: e2e
			? `${number(e2e.filter((test) => test.outcome === "passed" || test.outcome === "flaky").length)} of ${number(e2e.length)} browser tests passed${flaky ? `; ${number(flaky)} passed only when tried again` : ""}.`
			: undefined,
		verify_base_path: mounted(inputs.junit.basePath, inputs.junit.kiBootstrap),
		verify_lighthouse: inputs.budget
			? `First load ${kb(inputs.budget.firstLoad.size)}, budget ${kb(inputs.budget.firstLoad.budget)}.`
			: undefined,
	};
	return Object.entries(gates).map(([job, gate]) => ({
		job,
		...gate,
		outcome: outcome(job),
		detail: details[job],
	}));
}

export function verdict(results: GateResult[]): string {
	const failed = results.filter((result) => result.outcome === "failed");
	const notRun = results.filter((result) => result.outcome === "not run");
	if (failed.length > 0)
		return `${failed.length} of ${results.length} checks failed.`;
	if (notRun.length === results.length)
		return "No check recorded a result in this pipeline.";
	if (notRun.length > 0)
		return `Every check that ran passed. ${notRun.length} of ${results.length} did not run in this pipeline.`;
	return `All ${results.length} checks passed.`;
}

const ESCAPES: Record<string, string> = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;",
	"'": "&#39;",
};
export const escape = (text: string) =>
	text.replace(/[&<>"']/g, (character) => ESCAPES[character] ?? character);

const MARK: Record<string, string> = {
	passed: "✓ Passed",
	flaky: "✓ Passed on a second try",
	failed: "✗ Failed",
	skipped: "– Skipped",
	"not run": "– Not run",
	"partly run": "◐ Partly run in this pipeline",
	"by hand": "Assessed by hand",
};
const mark = (outcome: string | undefined) =>
	`<span class="${outcome === "failed" ? "bad" : outcome === "passed" || outcome === "flaky" ? "good" : "muted"}">${escape(MARK[outcome ?? "not run"] ?? outcome ?? "")}</span>`;

const link = (url: string | undefined, text: string) =>
	url ? `<a href="${escape(url)}">${escape(text)}</a>` : escape(text);

/** A wide table scrolls inside itself on a phone, and that scroller is reachable by keyboard. */
const table = (label: string, head: string[], rows: string[][]) => `
<div class="scroll" role="region" aria-label="${escape(label)}" tabindex="0">
<table>
<caption>${escape(label)}</caption>
<thead><tr>${head.map((cell) => `<th scope="col">${escape(cell)}</th>`).join("")}</tr></thead>
<tbody>${rows.map(([first, ...rest]) => `<tr><th scope="row">${first}</th>${rest.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("\n")}</tbody>
</table>
</div>`;

const STYLE = `
:root { color-scheme: light dark; --bg: #ffffff; --text: #1a1a1a; --muted: #555555; --line: #c8c8c8; --good: #1b6e2a; --bad: #b3261e; --link: #0b57d0; --panel: #f4f4f4; }
@media (prefers-color-scheme: dark) { :root { --bg: #121212; --text: #ececec; --muted: #b4b4b4; --line: #4a4a4a; --good: #7bd88f; --bad: #ff8a80; --link: #8ab4f8; --panel: #1e1e1e; } }
body { margin: 0; background: var(--bg); color: var(--text); font: 16px/1.5 system-ui, sans-serif; }
header, main, footer { max-width: 64rem; margin: 0 auto; padding: 1rem; }
a { color: var(--link); }
.meta, .muted, caption { color: var(--muted); }
caption { text-align: left; padding: 0.25rem 0; }
.verdict { font-size: 1.25rem; padding: 0.75rem 1rem; background: var(--panel); border-left: 0.25rem solid var(--line); }
.good { color: var(--good); font-weight: 600; } .bad { color: var(--bad); font-weight: 600; }
.scroll { overflow-x: auto; margin: 0.5rem 0 1.5rem; }
table { border-collapse: collapse; width: 100%; }
th, td { text-align: left; vertical-align: top; padding: 0.4rem 0.6rem; border-bottom: 1px solid var(--line); }
details { margin: 0.5rem 0 1.5rem; } td details { margin: 0.25rem 0; } summary { cursor: pointer; }
ul.evidence { margin: 0; padding-left: 1.1rem; }
`;

/** What the tests found for one criterion: evidence, not a conformance claim, which is the VPAT's. */
function evidence(criterion: CriterionRow): string {
	const found: string[] = [];
	if (criterion.scans.checked) {
		const rules =
			criterion.rules.length === 1
				? "1 automated rule"
				: `${number(criterion.rules.length)} automated rules`;
		const outcome = criterion.scans.failed
			? `<span class="bad">✗ problems on ${number(criterion.scans.failed)}</span>`
			: "no problems found";
		found.push(
			`${rules} on ${number(criterion.scans.checked)} page checks: ${outcome}.<details><summary>What the rules for ${criterion.id} check</summary><ul>${criterion.rules.map((rule) => `<li>${escape(rule)}</li>`).join("")}</ul></details>`,
		);
	}
	if (criterion.tests.length) {
		const failed = criterion.tests.filter(
			(test) => test.outcome === "failed",
		).length;
		found.push(
			`${number(criterion.tests.length)} of our own tests: ${failed ? `<span class="bad">✗ ${number(failed)} failed</span>` : "all passed"}.`,
		);
	}
	return found.length
		? found.join("<br>")
		: "Not testable automatically; assessed by hand.";
}

export interface Figure {
	label: string;
	value: number;
}

/** The numbers worth comparing from one release to the next. */
export function figures(inputs: Inputs): Figure[] {
	const a11y = inputs.e2e ? accessibility(inputs.e2e, inputs.vpat) : undefined;
	const out: Figure[] = [];
	const add = (label: string, value: number | undefined) => {
		if (value !== undefined) out.push({ label, value });
	};
	add(
		"What every page loads first, KB",
		inputs.budget && Math.round(inputs.budget.firstLoad.size / 1024),
	);
	add("Unit tests", inputs.junit.unit?.tests);
	add("Browser tests", inputs.e2e?.length);
	add("Accessibility page checks", a11y?.scans.length);
	add("Accessibility problems found", a11y?.problems);
	add(
		"WCAG A and AA criteria assessed by hand",
		a11y?.criteria.filter((criterion) => criterion.result === "by hand").length,
	);
	add(
		"Requirements passed",
		requirementResults(inputs).filter((row) => row.result === "passed").length,
	);
	const npm = inputs.security?.npm;
	add(
		"High or critical advisories in shipped libraries",
		npm && npm.high + npm.critical,
	);
	for (const { page, scores } of inputs.lighthouse?.pages ?? []) {
		for (const [category, score] of Object.entries(scores)) {
			add(`Lighthouse ${category.replace("-", " ")} on ${page}`, score);
		}
	}
	return out;
}

/** A review older than this is reported as needing attention. */
export const REVIEW_AFTER_MONTHS = 6;

const monthName = (iso: string) =>
	new Intl.DateTimeFormat("en-GB", {
		month: "long",
		year: "numeric",
		timeZone: "UTC",
	}).format(new Date(`${iso}T00:00:00Z`));

/** One test per file, describe path and title: the 320px project runs some a second time. */
function distinct<T extends { file: string; describe?: string; title: string }>(
	tests: T[],
): T[] {
	const seen = new Map<string, T>();
	for (const test of tests)
		seen.set(
			`${test.file}\u0000${test.describe ?? ""}\u0000${test.title}`,
			test,
		);
	return [...seen.values()];
}

/** Everything a reader should act on, in a sentence each. */
export function attention(inputs: Inputs): string[] {
	const items: string[] = [];
	const now = inputs.pipeline.when;
	const failed = gateResults(inputs).filter(
		(result) => result.outcome === "failed",
	);
	if (failed.length) {
		items.push(
			`${failed.length === 1 ? "A check failed" : `${failed.length} checks failed`}: ${failed.map((result) => result.title).join(", ")}.`,
		);
	}
	const stale = requirementResults(inputs).filter((row) => row.stale);
	if (stale.length)
		items.push(
			`Statements due for review: ${stale.map((row) => row.id).join(", ")}.`,
		);
	const vpat = inputs.vpatFacts;
	if (
		vpat?.updated &&
		monthsBetween(vpat.updated, now) >= REVIEW_AFTER_MONTHS
	) {
		items.push(
			`The accessibility conformance report (VPAT) was last updated on ${vpat.updated}, more than ${REVIEW_AFTER_MONTHS} months ago.`,
		);
	}
	if (
		vpat?.version &&
		inputs.version &&
		compareVersions(vpat.version, inputs.version) < 0
	) {
		items.push(
			`The VPAT describes ${vpat.version}, which is older than this build, ${inputs.version}.`,
		);
	}
	if (
		vpat?.manual &&
		monthsBetween(vpat.manual.date, now) >= REVIEW_AFTER_MONTHS
	) {
		items.push(
			`The manual accessibility evaluation was last carried out for ${vpat.manual.version}, in ${monthName(vpat.manual.date)}: more than ${REVIEW_AFTER_MONTHS} months ago.`,
		);
	}
	const product = inputs.security?.product;
	if (product && !product.declared)
		items.push(
			`package.json declares no licence, though LICENSE is the ${product.title}.`,
		);
	const unvetted = inputs.security?.licences?.unvetted ?? [];
	if (unvetted.length)
		items.push(
			`Libraries under a licence nobody has approved: ${unvetted.map((entry) => `${entry.name} (${entry.licence})`).join(", ")}.`,
		);
	const base = inputs.image?.base;
	if (base && !base.pinned) {
		items.push(
			`The image is built on ${base.image}, a tag that moves, so two builds of one commit can ship different system packages.`,
		);
	}
	const source = inputs.languages?.find((entry) => entry.kind === "source");
	for (const entry of inputs.languages ?? []) {
		if (
			source &&
			entry.kind === "translation" &&
			entry.translated < source.strings
		) {
			items.push(
				`${entry.name} is offered, but ${Math.floor((entry.translated / source.strings) * 100)}% of the interface is translated. The rest shows in British English.`,
			);
		}
	}
	const flaky = distinct(
		(inputs.e2e ?? []).filter((test) => test.outcome === "flaky"),
	);
	if (flaky.length)
		items.push(
			`${flaky.length === 1 ? "A browser test" : `${flaky.length} browser tests`} passed only on a second try.`,
		);
	const nightlyFailed = new Set(
		(inputs.nightly ?? [])
			.filter((test) => test.outcome === "failed")
			.map((test) => test.name),
	);
	if (nightlyFailed.size)
		items.push(
			`The last nightly flake hunt failed ${nightlyFailed.size === 1 ? "a test" : `${nightlyFailed.size} tests`}.`,
		);
	return items;
}

/** GOV.UK Secure by Design's ten principles, by number. */
export const SECURE_BY_DESIGN: Record<string, string> = {
	"1": "Create responsibility for cyber security risk",
	"2": "Source secure technology products",
	"3": "Adopt a risk-driven approach",
	"4": "Design usable security controls",
	"5": "Build in detect and respond security",
	"6": "Design flexible architectures",
	"7": "Minimise the attack surface",
	"8": "Defend in depth",
	"9": "Embed continuous assurance",
	"10": "Make changes securely",
};

const EN_301_549_CLAUSES: Record<string, string> = {
	"9": "Clause 9, web content",
};

/** Criteria new in WCAG 2.2, which EN 301 549 V3.2.1, following WCAG 2.1, has no clause for. */
const WCAG_22_ONLY = new Set([
	"2.4.11",
	"2.4.12",
	"2.4.13",
	"2.5.7",
	"2.5.8",
	"3.2.6",
	"3.3.7",
	"3.3.8",
	"3.3.9",
]);

/** EN 301 549 V3.2.1 numbers its web clauses as 9 and the WCAG criterion: 9.1.4.3 is 1.4.3. */
export const enClause = (criterion: string) =>
	WCAG_22_ONLY.has(criterion) ? undefined : `9.${criterion}`;

/** Each requirement in the catalogue, with what this pipeline found for it. */
export function requirementResults(inputs: Inputs): RequirementRow[] {
	const byJob = new Map(
		gateResults(inputs).map((result) => [result.job, result]),
	);
	const a11y = inputs.e2e ? accessibility(inputs.e2e, inputs.vpat) : undefined;
	const byHand =
		a11y?.criteria.filter((criterion) => criterion.result === "by hand")
			.length ?? 0;
	return evaluate(inputs.catalogue ?? catalogue, {
		checkOutcome: (job) => byJob.get(job)?.outcome ?? "not run",
		checkTitle: (job) => byJob.get(job)?.title ?? job,
		e2e: inputs.e2e,
		unit: inputs.unit,
		accessibility: a11y
			? {
					outcome:
						a11y.problems > 0 ||
						a11y.tests.some((test) => test.outcome === "failed") ||
						a11y.criteria.some((criterion) => criterion.result === "failed")
							? "failed"
							: "passed",
					detail: `${number(a11y.scans.length)} page checks and ${number(a11y.others.length)} further tests. ${number(byHand)} of ${number(a11y.criteria.length)} criteria are assessed by hand, as the VPAT states.`,
				}
			: undefined,
		today: inputs.pipeline.when,
	});
}

/** The report as data, for anything that reads it rather than a person: a tender matrix, a dashboard. */
export function reportData(inputs: Inputs) {
	const checks = gateResults(inputs);
	const a11y = inputs.e2e ? accessibility(inputs.e2e, inputs.vpat) : undefined;
	return {
		product: "DCB Admin",
		pipeline: { ...inputs.pipeline, when: inputs.pipeline.when.toISOString() },
		verdict: verdict(checks),
		checks: checks.map(({ job, title, outcome, detail }) => ({
			job,
			title,
			outcome,
			detail: detail ?? null,
		})),
		requirements: requirementResults(inputs),
		accessibility: a11y
			? {
					pages: a11y.pages.length,
					pageChecks: a11y.scans.length,
					problems: a11y.problems,
					criteria: a11y.criteria.map(
						({ id, level, result, handAssessed }) => ({
							id,
							level,
							result,
							conformance: handAssessed ?? null,
						}),
					),
				}
			: null,
		budget: inputs.budget ?? null,
		lighthouse: inputs.lighthouse ?? null,
		attention: attention(inputs),
		figures: figures(inputs),
		compatibility: inputs.compatibility ?? null,
		changes: inputs.changes ?? null,
		knownGaps: inputs.vpatFacts?.gaps ?? null,
		vpat: inputs.vpatFacts
			? {
					version: inputs.vpatFacts.version ?? null,
					updated: inputs.vpatFacts.updated ?? null,
					manual: inputs.vpatFacts.manual ?? null,
				}
			: null,
		security: inputs.security
			? {
					...inputs.security,
					sbom: "Added once the organisation's SBOM policy is agreed",
				}
			: null,
		image: inputs.image ?? null,
		storage: (inputs.e2e ?? []).find((test) => test.storage)?.storage ?? null,
		browsers: [
			...new Set(
				(inputs.e2e ?? [])
					.map((test) => test.project)
					.filter((project) => project !== undefined),
			),
		],
		languages: inputs.languages ?? null,
		reliability: {
			passedOnRetry: distinct(
				(inputs.e2e ?? []).filter((test) => test.outcome === "flaky"),
			).map((test) => test.covers ?? test.title),
			nightly: inputs.nightly
				? {
						tests: new Set(inputs.nightly.map((test) => test.name)).size,
						failed: [
							...new Set(
								inputs.nightly
									.filter((test) => test.outcome === "failed")
									.map((test) => test.name),
							),
						],
					}
				: null,
		},
	};
}

const code = (text: string) => `<code>${escape(text)}</code>`;
const list = (items: string[]) =>
	items.length
		? `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`
		: "";
const percent = (part: number, whole: number) =>
	`${Math.floor((part / whole) * 100)}%`;

function compatibilitySection(inputs: Inputs): string {
	const compatibility = inputs.compatibility;
	if (!compatibility) return "";
	const features = [...compatibility.features].sort(
		(a, b) =>
			(a.since === null ? 1 : 0) - (b.since === null ? 1 : 0) ||
			compareVersions(a.since ?? "0", b.since ?? "0"),
	);
	return `
<h2>Compatibility</h2>
<p>This build is checked against the schemas of dcb-service ${compatibility.schemas.map(escape).join(", ")}: a field a release does not have fails a test. A feature that needs a newer dcb-service stays off until an environment turns it on, with the variable named, once its dcb-service is new enough.</p>
${table(
	"Features that depend on the dcb-service release",
	["Feature", "Needs dcb-service", "Turned on by"],
	features.map((feature) => [
		escape(feature.name),
		feature.since
			? `${escape(feature.since)} or later`
			: `<span class="muted">Not yet in a release</span>`,
		code(feature.flag),
	]),
)}
${compatibility.deploymentFlags.length ? `<p>Set per deployment, whatever its dcb-service: ${compatibility.deploymentFlags.map(code).join(", ")}.</p>` : ""}`;
}

function changesSection(inputs: Inputs): string {
	const changes = inputs.changes;
	const current = figures(inputs);
	const before = new Map(
		(inputs.previous?.figures ?? []).map((figure) => [
			figure.label,
			figure.value,
		]),
	);
	const against = inputs.previous?.pipeline?.tag ?? "the last release";
	const notes = changes?.notes;
	return `
<h2>What changed</h2>
${
	notes
		? `<p>Since ${escape(changes?.since ?? "the first release")}: ${number(notes.features.length)} new or changed features and ${number(notes.fixes.length)} fixes${notes.breaking.length ? `, <span class="bad">${number(notes.breaking.length)} of them breaking</span>` : ""}. ${number(notes.other)} further changes were to tests, the pipeline or documentation.</p>
${notes.breaking.length ? `<h3>Breaking</h3>${list(notes.breaking.map(escape))}` : ""}
${notes.features.length ? `<details><summary>New or changed (${notes.features.length})</summary>${list(notes.features.map(escape))}</details>` : ""}
${notes.fixes.length ? `<details><summary>Fixed (${notes.fixes.length})</summary>${list(notes.fixes.map(escape))}</details>` : ""}`
		: "<p>The history since the last release was not available to this pipeline.</p>"
}
${
	before.size
		? table(
				`This build against ${against}`,
				["Figure", "This build", escape(sentenceCase(against)), "Change"],
				current.map(({ label, value }) => {
					const was = before.get(label);
					const change =
						was === undefined
							? ""
							: value - was === 0
								? "same"
								: `${value - was > 0 ? "+" : ""}${number(value - was)}`;
					return [
						escape(label),
						number(value),
						was === undefined ? `<span class="muted">—</span>` : number(was),
						escape(change),
					];
				}),
			)
		: "<p>No earlier release report was available to compare with.</p>"
}`;
}

function knownGaps(inputs: Inputs): string {
	const vpat = inputs.vpatFacts;
	if (!vpat) return "";
	return `
<h3>Known gaps</h3>
<p>Every criterion the VPAT itself rates below full support, at any level.</p>
${table(
	"Known gaps, as the VPAT states them",
	["Criterion", "Level", "Conformance", "What the VPAT says"],
	vpat.gaps.map((gap) => {
		const known = wcag[gap.id as keyof typeof wcag];
		return [
			`${escape(gap.id)} ${escape(known?.name ?? gap.name)}`,
			escape(known?.level ?? ""),
			escape(gap.conformance),
			escape(gap.remarks),
		];
	}),
)}
<h3>How current the assessment is</h3>
<p>The VPAT describes ${escape(vpat.version ?? "an unstated version")}${vpat.updated ? ` and was last updated on ${escape(vpat.updated)}` : ""}.${vpat.manual ? ` Its manual evaluation was last carried out for ${escape(vpat.manual.version)}, in ${escape(monthName(vpat.manual.date))}.` : ""}</p>`;
}

function securitySection(inputs: Inputs): string {
	const security = inputs.security;
	const image = inputs.image;
	if (!security && !image) return "";
	const npm = security?.npm;
	const licences = security?.licences;
	return `
<h2>Security</h2>
${
	security?.headers.length
		? `<h3>What the deployed image sends</h3>
<p>The security headers on every response. The browser tests run under the same Content Security Policy, and the container gate checks the image sends these from every address.</p>
${table(
	"Security headers",
	["Header", "Value"],
	security.headers.map((header) => [escape(header.name), code(header.value)]),
)}`
		: ""
}
<h3>Known vulnerabilities</h3>
${
	npm
		? `<p>In the libraries the application ships with, as npm's advisory database rates them: ${SEVERITIES.filter(
				(severity) => severity !== "info",
			)
				.map((severity) => `${severity} ${number(npm[severity])}`)
				.join(", ")}. The dependency check fails on high or worse.</p>`
		: "<p>The dependency check did not run in this pipeline.</p>"
}
<h3>Secrets</h3>
<p>${security?.secrets === undefined ? "The secret scan did not run in this pipeline." : security.secrets === 0 ? "The secret scan found no new secret anywhere in the code's history." : `<span class="bad">The secret scan found ${number(security.secrets)} new secrets.</span>`}</p>
<h3>Licences</h3>
${security?.product ? `<p>DCB Admin itself is under the ${escape(security.product.title)}, in ${code("LICENSE")}. ${security.product.declared ? `package.json declares ${code(security.product.declared)}.` : "package.json declares no licence."}</p>` : ""}
${
	licences
		? `<p>${number(licences.packages)} libraries ship with the application. ${number(licences.packages - licences.commercial.length - licences.unvetted.length)} are under an approved open-source licence${licences.commercial.length ? `, and ${number(licences.commercial.length)} are MUI X's commercial packages, covered by its licence key` : ""}.${licences.unvetted.length ? ` <span class="bad">${number(licences.unvetted.length)} are under a licence nobody has approved.</span>` : ""}</p>
${table(
	"Licences of the libraries that ship",
	["Licence", "Libraries"],
	Object.entries(licences.byLicence)
		.sort((a, b) => b[1] - a[1])
		.map(([licence, count]) => [escape(licence), number(count)]),
)}`
		: "<p>The licence check did not run in this pipeline.</p>"
}
${
	image
		? `<h3>The container image</h3>
<p>${image.base ? `Built on ${code(image.base.image)}, ${image.base.pinned ? "an exact release" : `<span class="bad">a tag that moves</span>`}.` : ""} ${image.digest ? `The base image's digest when the container gate ran: ${code(image.digest)}.` : "The container gate did not run in this pipeline, so the base image's digest was not recorded."} ${image.tags.length ? `This pipeline publishes it as ${image.tags.map(escape).join(" and ")}.` : "This pipeline publishes no image."}</p>`
		: ""
}
<p class="notice">Software bills of materials (SBOMs) for the application and its image will be added to this report once the organisation's SBOM policy is agreed.</p>`;
}

function privacySection(inputs: Inputs): string {
	const tests = distinct(
		(inputs.e2e ?? []).filter((test) =>
			test.tags.some((tag) => tag.startsWith("req-PRIV-")),
		),
	);
	const storage = (inputs.e2e ?? []).find((test) => test.storage)?.storage;
	const names = (keys: string[]) =>
		keys.length ? keys.map(code).join(", ") : "none";
	return `
<h2>Privacy</h2>
<p>The privacy requirements, and what proves each, are under Requirements above. The browser tests written for them:</p>
${
	list(
		[...Map.groupBy(tests, (test) => test.covers ?? test.title)].map(
			([covers, group]) => {
				const outcome = group.some((test) => test.outcome === "failed")
					? "failed"
					: group.every((test) => test.outcome === "passed")
						? "passed"
						: group[0].outcome;
				return `${mark(outcome)} ${escape(covers)}${group.length > 1 ? ` <span class="muted">(${group.length} tests)</span>` : ""}`;
			},
		),
	) ||
	`<p>${inputs.e2e ? "None of them ran in this pipeline." : "The browser tests did not run in this pipeline."}</p>`
}
<h3>What the browser stores</h3>
${
	storage
		? `<p>Recorded after a patron was validated, by name only: values are never recorded. A key that names the sign-in service carries the deployment's own address in production, not the test one shown here.</p>
<ul><li>Local storage: ${names(storage.local)}</li><li>Session storage: ${names(storage.session)}</li><li>Cookies: ${names(storage.cookies)}</li></ul>`
		: "<p>The storage test did not run in this pipeline.</p>"
}`;
}

function browsersSection(inputs: Inputs): string {
	const projects = [
		...new Set(
			(inputs.e2e ?? [])
				.map((test) => test.project)
				.filter((project): project is string => project !== undefined),
		),
	];
	if (!projects.length) return "";
	return `
<h2>Browser support</h2>
<p>The browser tests ran in ${projects.map((project) => escape(PROJECT_BROWSERS[project] ?? project)).join(", and in ")}. Firefox and Safari are not tested. Microsoft Edge uses the same engine as Chrome.</p>`;
}

function languagesSection(inputs: Inputs): string {
	const languages = inputs.languages;
	const source = languages?.find((entry) => entry.kind === "source");
	if (!languages || !source) return "";
	const how = {
		source: "The source every other language starts from",
		overlay: "Only what differs from British English",
		translation: "A translation",
	};
	return `
<h2>Languages</h2>
${table(
	"Languages a user can choose",
	["Language", "What it is", "Strings", "Of the interface"],
	languages.map((entry) => [
		escape(entry.name),
		escape(how[entry.kind]),
		number(entry.strings),
		entry.kind === "overlay"
			? "All of it: the rest falls back to British English"
			: `${percent(entry.translated, source.strings)}${entry.obsolete ? ` <span class="muted">(${number(entry.obsolete)} strings no longer used)</span>` : ""}`,
	]),
)}`;
}

function reliabilitySection(inputs: Inputs): string {
	const retried = distinct(
		(inputs.e2e ?? []).filter((test) => test.outcome === "flaky"),
	);
	const nightly = inputs.nightly;
	const nightlyFailed = [
		...new Set(
			(nightly ?? [])
				.filter((test) => test.outcome === "failed")
				.map((test) => test.name),
		),
	];
	return `
<h2>Test reliability</h2>
<p>${inputs.e2e ? (retried.length ? `${number(retried.length)} browser tests passed only on a second try in this pipeline:` : "Every browser test that passed did so on its first try.") : "The browser tests did not run in this pipeline."}</p>
${list(retried.map((test) => escape(test.covers ?? test.title)))}
<p>${nightly ? `The last nightly flake hunt ran ${number(new Set(nightly.map((test) => test.name)).size)} browser tests several times each, with no retries: ${nightlyFailed.length ? `<span class="bad">${number(nightlyFailed.length)} failed at least once.</span>` : "none failed."}` : "No nightly flake-hunt result was available."}</p>
${list(nightlyFailed.map(escape))}`;
}

export function render(inputs: Inputs): string {
	const results = gateResults(inputs);
	const a11y = inputs.e2e ? accessibility(inputs.e2e, inputs.vpat) : undefined;
	const { pipeline } = inputs;
	const when = new Intl.DateTimeFormat("en-GB", {
		dateStyle: "long",
		timeStyle: "short",
		timeZone: "UTC",
	}).format(pipeline.when);

	const checks = table(
		"Every check in this pipeline",
		["Check", "Result", "What it checks", "Why it matters"],
		results.map((result) => [
			escape(result.title),
			`${mark(result.outcome)}${result.detail ? `<br><span class="muted">${escape(result.detail)}</span>` : ""}`,
			escape(result.checks),
			escape(result.matters),
		]),
	);

	const requirementsSection = `
<h2>Requirements</h2>
<p>What this application is required to do, and the evidence this pipeline produced for each. A requirement passes only when all of its automated evidence ran and passed. One assessed by hand says when it was last reviewed.</p>
${table(
	"Every requirement",
	[
		"Requirement",
		"Area",
		"Result",
		"Evidence",
		"Secure by Design",
		"EN 301 549",
	],
	requirementResults(inputs).map((row) => {
		const standards = (inputs.catalogue ?? catalogue)[row.id]?.standards ?? {};
		return [
			`${escape(row.id)} ${escape(row.requirement)}`,
			escape(row.category),
			mark(row.result),
			`<ul class="evidence">${row.evidence.map((item) => `<li>${escape(item.label)}: ${mark(item.outcome)}${item.detail ? ` <span class="muted">${escape(item.detail)}</span>` : ""}</li>`).join("")}</ul>`,
			(standards.sbd ?? [])
				.map(
					(principle) =>
						`${escape(principle)}. ${escape(SECURE_BY_DESIGN[principle] ?? "")}`,
				)
				.join("<br>") || `<span class="muted">—</span>`,
			(standards.en301549 ?? [])
				.map((clause) =>
					escape(EN_301_549_CLAUSES[clause] ?? `Clause ${clause}`),
				)
				.join("<br>") || `<span class="muted">—</span>`,
		];
	}),
)}
<p class="muted">Secure by Design is the UK government's ten principles for secure digital services. EN 301 549 is the European accessibility standard for ICT, whose clause 9 is WCAG for the web.</p>`;

	const accessibilitySection = a11y
		? `
<h2>Accessibility: WCAG 2.2 level AA</h2>
<p>${number(a11y.pages.length)} pages, each checked in the views the table marks: light mode, dark mode, high contrast and phone width. ${number(a11y.scans.length)} page checks, ${a11y.problems === 0 ? "no problems found by the automated rules" : `<span class="bad">✗ ${number(a11y.problems)} with problems</span>`}. ${number(a11y.others.length)} further tests check particular things, such as landmarks, focus, announcements and Windows high contrast mode.</p>
${table(
	"Pages checked",
	["Page", "Light mode", "Dark mode", "High contrast", "Phone width"],
	a11y.matrix.map(({ page, cells }) => [
		escape(sentenceCase(page)),
		...cells.map(mark),
	]),
)}
<h3>Each WCAG 2.2 A and AA success criterion</h3>
<p>Each criterion shows two things. What our tests found is evidence: automated rules (axe) run on every page check, and tests written for this application. An automated rule usually checks only part of a criterion, so “no problems found” does not by itself mean the criterion is met. Whether it is met is a judgement made by hand for every criterion and stated in the accessibility conformance report (VPAT), which the last column repeats.</p>
${table(
	"WCAG 2.2 A and AA",
	[
		"Criterion",
		"EN 301 549",
		"What it means",
		"What our tests found",
		"Conformance, as the VPAT states it",
	],
	a11y.criteria.map((criterion) => [
		`${criterion.id} ${escape(criterion.name)} <span class="muted">(${criterion.level})</span>`,
		enClause(criterion.id) ?? `<span class="muted">WCAG 2.2 only</span>`,
		escape(criterion.plain),
		evidence(criterion),
		criterion.handAssessed
			? escape(criterion.handAssessed)
			: `<span class="muted">Not stated</span>`,
	]),
)}
${
	a11y.beyond.length
		? `<p>Also covered by our tests, beyond level AA: ${a11y.beyond.map((criterion) => `${criterion.id} ${escape(criterion.name)}, ${criterion.result === "failed" ? "problems found" : "no problems found"}`).join("; ")}.</p>`
		: ""
}
<p class="muted">EN 301 549 numbers are from V3.2.1, which follows WCAG 2.1: criteria new in WCAG 2.2 have no clause there. Its 9.4.1.1 Parsing, which WCAG 2.2 removed, is not reported here.</p>
${knownGaps(inputs)}
<h3>What automated testing cannot tell you</h3>
<p>Automated checks find roughly a third of accessibility problems. The rest, including whether the application makes sense to someone using a screen reader, is assessed by hand and recorded, with where we know we fall short, in the ${link(pipeline.vpatUrl, "accessibility conformance report (VPAT)")}.</p>
<details><summary>Every accessibility test, and what it checks (${a11y.others.length} not counting the page scans)</summary>
<ul>${a11y.others
				.map(
					(test) =>
						`<li>${mark(test.outcome)} ${escape(test.covers ?? test.title)}</li>`,
				)
				.join("\n")}</ul>
</details>`
		: `<h2>Accessibility: WCAG 2.2 level AA</h2><p>The browser tests did not run in this pipeline, so there are no accessibility results.</p>`;

	const speed =
		inputs.budget || inputs.lighthouse
			? `
<h2>Speed</h2>
${
	inputs.budget
		? `<p>Before any page can be used, the browser downloads ${kb(inputs.budget.firstLoad.size)}, against a budget of ${kb(inputs.budget.firstLoad.budget)}. ${(() => {
				const over = [
					...inputs.budget.routes,
					...inputs.budget.onDemand,
				].filter((entry) => entry.size !== null && entry.size > entry.budget);
				return over.length
					? `Over their own budgets: ${over.map((entry) => escape(entry.name)).join(", ")}.`
					: "Every large library loaded on demand is within its own budget.";
			})()}</p>`
		: ""
}
${
	inputs.lighthouse
		? `${inputs.lighthouse.pages
				.map(
					({ page, scores }) =>
						`<p>Google Lighthouse, on ${escape(page)}: ${Object.entries(scores)
							.map(
								([category, score]) =>
									`${escape(category.replace("-", " "))} ${score}`,
							)
							.join(", ")} (out of 100).</p>`,
				)
				.join(
					"\n",
				)}${inputs.lighthouse.failures.length ? `<p>Over its limits: ${inputs.lighthouse.failures.map((failure) => `${escape(failure.auditId)} (${failure.level})`).join(", ")}.</p>` : ""}`
		: ""
}`
			: "";

	const failedTests = (inputs.e2e ?? []).filter(
		(test) => test.outcome === "failed",
	);
	const needs = attention(inputs);
	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Release report: DCB Admin</title>
<style>${STYLE}</style>
</head>
<body>
<header>
<h1>DCB Admin: release report</h1>
<p class="meta">${pipeline.commit ? `Commit ${link(pipeline.commitUrl, pipeline.commit)}` : "Built locally"}${pipeline.tag ? `, released as ${escape(pipeline.tag)}` : ""}${pipeline.ref ? ` on branch ${escape(pipeline.ref)}` : ""}${pipeline.pipelineUrl ? `, ${link(pipeline.pipelineUrl, "pipeline")}` : ""}, ${escape(when)} UTC.</p>
${pipeline.onDemand ? `<p class="meta">Run on demand. Nothing was released or deployed from this pipeline.</p>` : ""}
</header>
<main>
<p class="verdict">${escape(verdict(results))}</p>
${needs.length ? `<h2>Needs attention</h2><ul>${needs.map((item) => `<li>${escape(item)}</li>`).join("")}</ul>` : ""}
${requirementsSection}
${compatibilitySection(inputs)}
${changesSection(inputs)}
${accessibilitySection}
${securitySection(inputs)}
${privacySection(inputs)}
${browsersSection(inputs)}
${languagesSection(inputs)}
${speed}
${reliabilitySection(inputs)}
<h2>Checks</h2>
${checks}
${failedTests.length ? `<h2>Failed tests</h2><ul>${failedTests.map((test) => `<li>${escape(test.covers ?? test.title)} <span class="muted">(${escape(test.file)})</span></li>`).join("\n")}</ul>` : ""}
</main>
<footer class="muted"><p>Made from the results of this pipeline's own checks, not written by hand. What each check covers is written next to the check itself.</p></footer>
</body>
</html>
`;
}

function main() {
	const read = (path: string) =>
		existsSync(path) ? readFileSync(path, "utf8") : undefined;
	const parse = <T>(path: string): T | undefined => {
		const text = read(path);
		return text === undefined ? undefined : (JSON.parse(text) as T);
	};
	const junit = (path: string) => {
		const xml = read(path);
		return xml === undefined ? undefined : junitCounts(xml);
	};
	const unitXml = read(join("reports", "unit-junit.xml"));

	const statusDir = join("reports", "status");
	const statuses: Record<string, string> = {};
	if (existsSync(statusDir)) {
		for (const file of readdirSync(statusDir).filter((name) =>
			name.endsWith(".json"),
		)) {
			const entry = parse<{ job: string; status: string }>(
				join(statusDir, file),
			);
			if (entry) statuses[entry.job] = entry.status;
		}
	}

	const playwright = parse<{ suites: PwSuite[] }>(join("reports", "e2e.json"));
	const manifest = parse<
		{
			url: string;
			isRepresentativeRun: boolean;
			summary: Record<string, number>;
		}[]
	>(join(".lighthouseci", "manifest.json"));
	const representative = (manifest ?? []).filter(
		(run) => run.isRepresentativeRun,
	);
	const assertions = parse<
		{
			auditId: string;
			level: string;
			actual: number;
			expected: number;
			passed: boolean;
		}[]
	>(join(".lighthouseci", "assertion-results.json"));
	const env = process.env;
	const git = (...args: string[]) => {
		try {
			return execFileSync("git", args, { encoding: "utf8" }).trim();
		} catch {
			return undefined;
		}
	};
	const head = git("rev-parse", "HEAD");
	const tags = (
		git(
			"tag",
			"--merged",
			"HEAD",
			"--list",
			"v*",
			"--format=%(refname:short) %(objectname) %(*objectname)",
		) ?? ""
	)
		.split("\n")
		.filter(Boolean)
		.map((line) => {
			const [name, object, peeled] = line.split(" ");
			return { name, commit: peeled || object };
		});
	const since = head ? previousTag(tags, head) : undefined;
	const subjects = since
		? git("log", `${since}..HEAD`, "--no-merges", "--format=%s")
		: undefined;
	const capabilitySource =
		read(join("src", "constants", "serviceCapabilities.ts")) ?? "";
	const featureNames =
		parse<{ service_capabilities?: { feature?: Record<string, string> } }>(
			join("src", "locales", "en-GB", "application.json"),
		)?.service_capabilities?.feature ?? {};
	const pkg =
		parse<{ version?: string; license?: string }>("package.json") ?? {};
	const audit = parse<Parameters<typeof npmAdvisories>[0]>(
		join("reports", "npm-audit.json"),
	);
	const sarif = parse<Parameters<typeof secretFindings>[0]>(
		join("..", "gitleaks.sarif"),
	);
	const nightlyXml = read(join("reports", "nightly-junit.xml"));
	const sourceStrings = parse<unknown>(
		join("src", "locales", "en-GB", "application.json"),
	);
	const languages = [
		"en-GB",
		...offeredLanguages(read(join("src", "helpers", "locale.ts")) ?? "").filter(
			(code) => code !== "en-GB",
		),
	].flatMap((code): Language[] => {
		const bundled = join("src", "locales", code, "application.json");
		const loaded = join("public", "locales", code, "application.json");
		const kind: Language["kind"] =
			code === "en-GB"
				? "source"
				: existsSync(bundled)
					? "overlay"
					: "translation";
		const strings = parse<unknown>(kind === "translation" ? loaded : bundled);
		return strings === undefined
			? []
			: [
					language(
						code,
						LANGUAGE_NAMES[code] ?? code,
						kind,
						strings,
						sourceStrings,
					),
				];
	});
	// This application sits one level below the repository root
	const blob = (path: string) =>
		env.CI_PROJECT_URL && env.CI_COMMIT_SHA
			? `${env.CI_PROJECT_URL}/-/blob/${env.CI_COMMIT_SHA}/dcb-hub-admin-ui/${path}`
			: undefined;

	const inputs: Inputs = {
		statuses,
		unit: unitXml === undefined ? undefined : unitCases(unitXml),
		e2e: playwright ? e2eTests(playwright) : undefined,
		junit: {
			unit: junit(join("reports", "unit-junit.xml")),
			basePath: junit(join("reports", "base-path-junit.xml")),
			kiBootstrap: junit(join("reports", "ki-bootstrap-junit.xml")),
		},
		budget: parse<Budget>(join("reports", "bundle-budget.json")),
		lighthouse: representative.length
			? {
					pages: representative.map((run) => ({
						page: new URL(run.url).pathname,
						scores: Object.fromEntries(
							Object.entries(run.summary).map(([category, score]) => [
								category,
								Math.round(score * 100),
							]),
						),
					})),
					failures: (assertions ?? []).filter((assertion) => !assertion.passed),
				}
			: undefined,
		vpat: vpatConformance(read(join("docs", "DCB_Admin_VPAT.md")) ?? ""),
		version: env.CI_COMMIT_TAG ?? (pkg.version ? `v${pkg.version}` : undefined),
		compatibility: {
			schemas: schemaVersions(readdirSync(".")),
			features: capabilitiesFrom(capabilitySource).map((feature) => ({
				...feature,
				name: featureNames[feature.id] ?? feature.id,
			})),
			deploymentFlags: deploymentFlagsFrom(capabilitySource),
		},
		changes:
			subjects === undefined
				? undefined
				: { since, notes: releaseNotes(subjects.split("\n").filter(Boolean)) },
		previous: parse<NonNullable<Inputs["previous"]>>(
			join("reports", "previous-report.json"),
		),
		vpatFacts: vpatFacts(read(join("docs", "DCB_Admin_VPAT.md")) ?? ""),
		security: {
			headers: securityHeaders(
				read(join("docker", "production", "security-headers.conf")) ?? "",
			),
			npm: audit ? npmAdvisories(audit) : undefined,
			secrets: sarif ? secretFindings(sarif) : undefined,
			licences: parse<Licences>(join("reports", "licences.json")),
			product: productLicence(read(join("..", "LICENSE")) ?? "", pkg),
		},
		image: {
			base: runtimeBase(read(join("docker", "production", "Dockerfile")) ?? ""),
			digest: parse<{ digest?: string }>(join("reports", "image.json"))?.digest,
			tags: publishedTags({
				branch: env.CI_COMMIT_BRANCH,
				shortSha: env.CI_COMMIT_SHORT_SHA,
				onDemand: env.ON_DEMAND_REPORT === "true",
			}),
		},
		languages,
		nightly: nightlyXml === undefined ? undefined : unitCases(nightlyXml),
		pipeline: {
			// A tag pipeline's ref name is the tag, not a branch
			ref: env.CI_COMMIT_TAG ? undefined : env.CI_COMMIT_REF_NAME,
			tag: env.CI_COMMIT_TAG,
			onDemand: env.ON_DEMAND_REPORT === "true",
			commit: env.CI_COMMIT_SHORT_SHA,
			commitUrl:
				env.CI_PROJECT_URL && env.CI_COMMIT_SHA
					? `${env.CI_PROJECT_URL}/-/commit/${env.CI_COMMIT_SHA}`
					: undefined,
			pipelineUrl: env.CI_PIPELINE_URL,
			vpatUrl: blob("docs/DCB_Admin_VPAT.md"),
			when: new Date(),
		},
	};
	mkdirSync("reports", { recursive: true });
	const out = join("reports", "release-report.html");
	writeFileSync(out, render(inputs));
	writeFileSync(
		join("reports", "release-report.json"),
		JSON.stringify(reportData(inputs), null, 2),
	);
	console.log(`Written to ${out}, with its data beside it.`);
}

// Not import.meta: this package is CommonJS, so Playwright loads this file as CommonJS for
// e2e/release-report.spec.ts, where import.meta does not parse
if (/[\\/]scripts[\\/]release-report\.ts$/.test(process.argv[1] ?? "")) main();
