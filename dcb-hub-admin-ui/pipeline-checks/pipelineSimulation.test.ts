import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parse, type YAMLSeq } from "yaml";

/**
 * The pipeline each kind of event creates, worked out from each job's own `rules`, so a job
 * that needs one its pipeline never contains fails here rather than on release day. What it
 * evaluates and what it cannot: docs/testing.md, "The pipeline config lint".
 */

/** A `!reference [.job, key]`, resolved once the whole file is read */
class Reference {
	constructor(readonly path: string[]) {}
}

type Config = Record<string, unknown>;

const config = parse(
	readFileSync(resolve(__dirname, "../../.gitlab-ci.yml"), "utf8"),
	{
		customTags: [
			{
				tag: "!reference",
				collection: "seq",
				resolve: (seq) =>
					new Reference((seq as YAMLSeq.Parsed).toJSON() as string[]),
			},
		],
	},
) as Config;

/** GitLab flattens a referenced list into the list that references it. */
function dereference(value: unknown): unknown {
	if (value instanceof Reference) {
		let target: unknown = config;
		for (const key of value.path)
			target = (target as Config | undefined)?.[key];
		if (target === undefined)
			throw new Error(`!reference [${value.path.join(", ")}] names nothing`);
		return dereference(target);
	}
	if (Array.isArray(value))
		return value.flatMap((item) => {
			const resolved = dereference(item);
			return item instanceof Reference && Array.isArray(resolved)
				? resolved
				: [resolved];
		});
	return value;
}

/** Top-level keys that are not jobs */
const KEYWORDS = new Set([
	"after_script",
	"before_script",
	"cache",
	"default",
	"image",
	"include",
	"services",
	"spec",
	"stages",
	"variables",
	"workflow",
]);

interface Rule {
	if?: string;
	changes?: unknown;
	when?: string;
}
interface Need {
	job: string;
	optional: boolean;
}
interface Job {
	stage: string;
	rules?: Rule[];
	needs: Need[];
	dependencies: string[];
}

/** `extends`, merged at the top level only: every key read below is a scalar or a list, which GitLab replaces rather than merges. */
function definition(name: string): Config {
	const own = config[name] as Config;
	const parents = own.extends === undefined ? [] : [own.extends].flat();
	return Object.assign(
		{},
		...parents.map((parent) => definition(parent as string)),
		own,
	) as Config;
}

const jobs = new Map<string, Job>(
	Object.keys(config)
		.filter((name) => !KEYWORDS.has(name) && !name.startsWith("."))
		.map((name) => {
			const job = definition(name);
			const needs = (dereference(job.needs) ?? []) as (
				string | { job: string; optional?: boolean }
			)[];
			return [
				name,
				{
					stage: (job.stage as string | undefined) ?? "test",
					rules: dereference(job.rules) as Rule[] | undefined,
					needs: needs.map((need) =>
						typeof need === "string"
							? { job: need, optional: false }
							: { job: need.job, optional: need.optional === true },
					),
					dependencies: (dereference(job.dependencies) ?? []) as string[],
				},
			];
		}),
);

const stages = config.stages as string[];

type Variables = Record<string, string | undefined>;

/** The pipeline-level defaults, such as ON_DEMAND_REPORT's "false" */
const defaults: Variables = Object.fromEntries(
	Object.entries((config.variables ?? {}) as Config).map(([name, value]) => [
		name,
		typeof value === "object" && value !== null
			? String((value as Config).value)
			: String(value),
	]),
);

const COMPARISON = /^\$(\w+)(?:\s*(==|!=|=~|!~)\s*(.+))?$/;

/** The expression syntax this file uses, and nothing else: anything unknown throws rather than guesses. */
function holds(expression: string, variables: Variables): boolean {
	return expression
		.split(/\s+\|\|\s+/)
		.some((any) =>
			any.split(/\s+&&\s+/).every((all) => compare(all.trim(), variables)),
		);
}

function compare(text: string, variables: Variables): boolean {
	const unknown = () =>
		new Error(
			`The simulation cannot evaluate "${text}": it knows $VAR, ==, !=, =~, !~, null, && and ||`,
		);
	const match = COMPARISON.exec(text);
	if (!match) throw unknown();
	const [, name, operator, operand] = match;
	const value = variables[name];
	if (!operator) return value !== undefined && value !== "";
	if (operator === "==" || operator === "!=") {
		// GitLab's null is an unset variable
		if (operand === "null")
			return (value === undefined) === (operator === "==");
		const quoted = /^"([^"]*)"$/.exec(operand);
		if (!quoted) throw unknown();
		return (value === quoted[1]) === (operator === "==");
	}
	const pattern = /^\/(.*)\/([a-z]*)$/.exec(operand);
	if (!pattern) throw unknown();
	const matches =
		value !== undefined && new RegExp(pattern[1], pattern[2]).test(value);
	return matches === (operator === "=~");
}

/** "maybe" where the answer turns on `changes`, which only GitLab can know */
type Presence = "always" | "maybe" | "never";

function presence(
	rules: Rule[],
	variables: Variables,
	changes: boolean | undefined,
): Presence {
	const [rule, ...rest] = rules;
	if (!rule) return "never";
	if (rule.if !== undefined && !holds(rule.if, variables))
		return presence(rest, variables, changes);
	const applied: Presence = rule.when === "never" ? "never" : "always";
	if (rule.changes === undefined) return applied;
	if (changes !== undefined)
		return changes ? applied : presence(rest, variables, changes);
	const otherwise = presence(rest, variables, changes);
	return applied === otherwise ? applied : "maybe";
}

interface Event {
	variables: Variables;
	/** GitLab treats `changes` as true in a pipeline no push created */
	changes?: boolean;
}

const EVENTS: Record<string, Event> = {
	"a push to main": {
		variables: { CI_PIPELINE_SOURCE: "push", CI_COMMIT_BRANCH: "main" },
	},
	"a push to release": {
		variables: { CI_PIPELINE_SOURCE: "push", CI_COMMIT_BRANCH: "release" },
	},
	"a merge request": {
		variables: { CI_PIPELINE_SOURCE: "merge_request_event" },
	},
	"a push to a branch with no merge request": {
		variables: { CI_PIPELINE_SOURCE: "push", CI_COMMIT_BRANCH: "feat/example" },
	},
	"the nightly schedule": {
		variables: { CI_PIPELINE_SOURCE: "schedule", CI_COMMIT_BRANCH: "main" },
		changes: true,
	},
	"a report run on demand": {
		variables: {
			CI_PIPELINE_SOURCE: "web",
			CI_COMMIT_BRANCH: "feat/example",
			ON_DEMAND_REPORT: "true",
		},
		changes: true,
	},
};

function pipeline({ variables, changes }: Event): Map<string, Presence> {
	const all = { ...defaults, ...variables };
	return new Map(
		[...jobs].map(([name, job]) => [
			name,
			job.rules === undefined ? "always" : presence(job.rules, all, changes),
		]),
	);
}

/** GitLab checks these only for the jobs a pipeline contains, so each pipeline is checked on its own. */
describe("the pipelines GitLab would create", () => {
	const events = Object.keys(EVENTS);

	it("finds the jobs", () => {
		expect(jobs.size).toBeGreaterThan(10);
	});

	it("puts every job in a stage the file declares", () => {
		expect(
			[...jobs]
				.filter(([, job]) => !stages.includes(job.stage))
				.map(([name, job]) => `${name}: ${job.stage}`),
		).toEqual([]);
	});

	it.each(events)("creates a pipeline for %s", (event) => {
		const workflow = dereference((config.workflow as Config).rules) as Rule[];
		expect(
			presence(
				workflow,
				{ ...defaults, ...EVENTS[event].variables },
				EVENTS[event].changes,
			),
		).toBe("always");
	});

	it.each(events)(
		"gives every job in %s the jobs it needs and depends on",
		(event) => {
			const present = pipeline(EVENTS[event]);
			const absent = (job: string) =>
				present.get(job) === "maybe" ? "may not contain" : "does not contain";
			const problems = [...jobs]
				.filter(([name]) => present.get(name) !== "never")
				.flatMap(([name, job]) => [
					...job.needs
						.filter(
							(need) =>
								!jobs.has(need.job) ||
								(!need.optional &&
									present.get(need.job) !== "always" &&
									// Identical rules put two jobs in exactly the same pipelines, `changes` or not
									JSON.stringify(job.rules) !==
										JSON.stringify(jobs.get(need.job)?.rules)),
						)
						.map((need) =>
							jobs.has(need.job)
								? `${name} needs ${need.job}, which this pipeline ${absent(need.job)}`
								: `${name} needs ${need.job}, which is not a job`,
						),
					...job.dependencies
						.filter(
							(dependency) =>
								present.get(dependency) !== "always" ||
								stages.indexOf(jobs.get(dependency)?.stage ?? "") >=
									stages.indexOf(job.stage),
						)
						.map((dependency) =>
							present.get(dependency) === "always"
								? `${name} depends on ${dependency}, which is not in an earlier stage`
								: `${name} depends on ${dependency}, which this pipeline ${absent(dependency)}`,
						),
				]);
			expect(problems).toEqual([]);
		},
	);
});

/** docs/testing.md, "The report on demand" */
describe("the release report's pipelines", () => {
	it.each([
		["a push to release", "always"],
		["a report run on demand", "always"],
		["a merge request", "never"],
		["a push to main", "never"],
		["a push to a branch with no merge request", "never"],
		["the nightly schedule", "never"],
	])("%s: %s", (event, expected) => {
		expect(pipeline(EVENTS[event]).get("report")).toBe(expected);
	});
});
