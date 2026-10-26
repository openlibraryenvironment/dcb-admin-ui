import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type Asset = { path: string; label: string; filepath?: string };
type Plugin = string | [string, { assets?: Asset[] }];

const releaseConfig = JSON.parse(
	readFileSync(resolve(__dirname, "../../.releaserc.json"), "utf8"),
) as { plugins: Plugin[] };

const gitlabAssets =
	releaseConfig.plugins.find(
		(plugin): plugin is [string, { assets?: Asset[] }] =>
			Array.isArray(plugin) && plugin[0] === "@semantic-release/gitlab",
	)?.[1].assets ?? [];

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
