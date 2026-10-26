// Lints .gitlab-ci.yml with GitLab itself, and simulates the pipeline a push to each long-lived
// branch would create. Why, and the token it needs: docs/testing.md, "The pipeline config lint".
//
// Usage: GITLAB_CI_LINT_TOKEN=<token> npm run ci:lint
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// A merge request pipeline proves the config only for a merge request; these are the
// pipelines it never creates
const REFS = ["main", "release"];

const token = process.env.GITLAB_CI_LINT_TOKEN;
const api = process.env.CI_API_V4_URL ?? "https://gitlab.com/api/v4";
const project = encodeURIComponent(
	process.env.CI_PROJECT_ID ?? "knowledge-integration/libraries/dcb-admin-ui",
);

if (!token) {
	console.error(
		"GITLAB_CI_LINT_TOKEN is not set, so the pipeline config cannot be checked.\n" +
			"Use a personal access token of your own.\n" +
			'docs/testing.md, "The pipeline config lint", says which token and why.',
	);
	process.exit(1);
}

const content = readFileSync(
	resolve(import.meta.dirname, "../../.gitlab-ci.yml"),
	"utf8",
);

async function lint(ref) {
	const response = await fetch(`${api}/projects/${project}/ci/lint`, {
		method: "POST",
		headers: { "PRIVATE-TOKEN": token, "Content-Type": "application/json" },
		body: JSON.stringify({ content, dry_run: true, include_jobs: true, ref }),
	});
	if (response.status === 401 || response.status === 403) {
		throw new Error(
			`GitLab refused the token (${response.status}): it has expired, or its scope or role is too low. docs/testing.md, "The pipeline config lint".`,
		);
	}
	if (!response.ok) {
		throw new Error(
			`GitLab answered ${response.status} ${response.statusText}.`,
		);
	}
	return /** @type {{ valid: boolean, errors: string[], warnings: string[], jobs?: { name: string, stage: string }[] }} */ (
		await response.json()
	);
}

let failed = false;
for (const ref of REFS) {
	let result;
	try {
		result = await lint(ref);
	} catch (error) {
		console.error(
			`${ref}: ${error instanceof Error ? error.message : String(error)}`,
		);
		process.exit(1);
	}
	if (!result.valid) failed = true;
	console.log(`\nA push to ${ref}: ${result.valid ? "valid" : "INVALID"}`);
	for (const error of result.errors) console.log(`  error: ${error}`);
	for (const warning of result.warnings) console.log(`  warning: ${warning}`);
	if (result.valid) {
		const byStage = new Map();
		for (const job of result.jobs ?? []) {
			byStage.set(job.stage, [...(byStage.get(job.stage) ?? []), job.name]);
		}
		for (const [stage, jobs] of byStage)
			console.log(`  ${stage}: ${jobs.join(", ")}`);
	}
}
process.exit(failed ? 1 : 0);
