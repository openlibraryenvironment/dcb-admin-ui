import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(__dirname, "../..");

/**
 * Files that cannot change what the browser gates test, so a merge request touching only
 * these skips them. Adding a pattern here is a claim about the app: review it as one.
 */
const NOT_APP = [
	"**/*.md",
	"dcb-hub-admin-ui/docs/**/*",
	"dcb-hub-admin-ui/.husky/**/*",
	// Checks of .gitlab-ci.yml itself, run locally: docs/testing.md, "The pipeline checks are local"
	"dcb-hub-admin-ui/pipeline-checks/**/*",
	"antora/**/*",
	"LICENSE",
	"renovate.json",
	"docker-compose.yml",
	// An empty stub: the application's lockfile is dcb-hub-admin-ui/package-lock.json
	"package-lock.json",
];

/** The `&app_paths` list in .gitlab-ci.yml: what a merge request must touch to run the gates. */
const appPaths = (() => {
	const lines = readFileSync(resolve(repoRoot, ".gitlab-ci.yml"), "utf8").split(
		"\n",
	);
	const start = lines.findIndex((line) => line.includes("paths: &app_paths"));
	const paths: string[] = [];
	for (const line of lines.slice(start + 1)) {
		const item = /^\s+- "?([^"]+)"?\s*$/.exec(line);
		if (!item) break;
		paths.push(item[1]);
	}
	return paths;
})();

/** GitLab's `changes` matching: Ruby fnmatch with FNM_PATHNAME, FNM_DOTMATCH and FNM_EXTGLOB. */
function matcher(glob: string): RegExp {
	let pattern = "";
	for (let i = 0; i < glob.length; i++) {
		const character = glob[i];
		if (glob.startsWith("**/", i)) {
			pattern += "(?:.*/)?";
			i += 2;
		} else if (character === "*") pattern += "[^/]*";
		else if (character === "?") pattern += "[^/]";
		else if (character === "{") pattern += "(?:";
		else if (character === "}") pattern += ")";
		else if (character === ",") pattern += "|";
		else pattern += character.replace(/[.+^$()|[\]\\]/g, "\\$&");
	}
	return new RegExp(`^${pattern}$`);
}

const matchesAny = (globs: string[]) => {
	const patterns = globs.map(matcher);
	return (file: string) => patterns.some((pattern) => pattern.test(file));
};

describe("the paths that run the browser gates on a merge request", () => {
	const files = execFileSync("git", ["ls-files"], {
		cwd: repoRoot,
		encoding: "utf8",
	})
		.split("\n")
		.filter(Boolean);
	const isApp = matchesAny(appPaths);
	const isNotApp = matchesAny(NOT_APP);

	it("reads the list from .gitlab-ci.yml", () => {
		expect(appPaths).toContain("dcb-hub-admin-ui/src/**/*");
		expect(files.length).toBeGreaterThan(100);
	});

	it("account for every tracked file, one way or the other", () => {
		expect(files.filter((file) => !isApp(file) && !isNotApp(file))).toEqual([]);
	});

	it("leave out documentation, so a docs-only merge request skips the gates", () => {
		for (const file of [
			"dcb-hub-admin-ui/docs/testing.md",
			"dcb-hub-admin-ui/docs/DCB_Admin_VPAT.md",
			"dcb-hub-admin-ui/CHANGELOG.md",
			"README.md",
		]) {
			expect(isApp(file), file).toBe(false);
		}
	});

	it("take in what the app is built and tested from", () => {
		for (const file of [
			"dcb-hub-admin-ui/src/main.tsx",
			"dcb-hub-admin-ui/e2e-base-path/navigation.spec.ts",
			"dcb-hub-admin-ui/docker/production/Dockerfile",
			"dcb-hub-admin-ui/package-lock.json",
			"dcb-hub-admin-ui/vite.config.mts",
			"dcb-hub-admin-ui/schema.graphqls",
			"dcb-hub-admin-ui/.npmrc",
			".gitlab-ci.yml",
		]) {
			expect(isApp(file), file).toBe(true);
		}
	});
});
