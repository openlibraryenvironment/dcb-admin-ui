import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type Asset = { path: string; label: string; filepath?: string };
type GitLabOptions = { assets?: Asset[]; successComment?: string | false };
type Plugin = string | [string, GitLabOptions];

const releaseConfig = JSON.parse(
	readFileSync(resolve(__dirname, "../../.releaserc.json"), "utf8"),
) as { plugins: Plugin[] };

const gitlab =
	releaseConfig.plugins.find(
		(plugin): plugin is [string, GitLabOptions] =>
			Array.isArray(plugin) && plugin[0] === "@semantic-release/gitlab",
	)?.[1] ?? {};
const gitlabAssets = gitlab.assets ?? [];

/** Links to the latest report, in the wiki and docs/testing.md, are built on these paths. */
describe("the release report's permanent link", () => {
	it.each([
		["reports/release-report.html", "/release-report.html"],
		["reports/release-report.json", "/release-report.json"],
	])("%s is attached to each release at %s", (path, filepath) => {
		expect(gitlabAssets.find((asset) => asset.path === path)?.filepath).toBe(
			filepath,
		);
	});
});

// It comments on every merged MR in the release at once, and a POST is never retried: 2.2.0's
// 216 commits drew a 429 that failed the release job after the tag and release existed.
describe("the release's last step", () => {
	it("posts no comment on the merge requests a release includes", () => {
		expect(gitlab.successComment).toBe(false);
	});
});
