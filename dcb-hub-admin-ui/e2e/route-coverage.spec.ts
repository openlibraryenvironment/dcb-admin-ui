import { test, expect } from "@playwright/test";
import { readFileSync, readdirSync } from "node:fs";
import { join, sep } from "node:path";

import { ROUTES } from "./fixtures/routes";

/**
 * Every route is scanned, or is excluded on the record - W-12.
 *
 * Why this is a gate and not a script: docs/accessibility.md, "Knowing what is covered".
 * Three hand-rolled versions of this measurement each reported a confident wrong answer.
 */

/** Route patterns as the file tree defines them, e.g. `/libraries/$libraryId/bibs`. */
function navigableRoutes(): string[] {
	const files: string[] = [];
	const walk = (dir: string) => {
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			const full = join(dir, entry.name);
			if (entry.isDirectory()) walk(full);
			else if (entry.name.endsWith(".tsx")) files.push(full);
		}
	};
	walk(join("src", "routes"));

	return [
		...new Set(
			files
				.map((file) => file.split(sep).join("/"))
				.map((file) =>
					file
						.replace("src/routes", "")
						.replace(/\.tsx$/, "")
						.replace("/__root", "")
						.replace("/__authenticated", "")
						.replace(/\/index$/, ""),
				)
				.map((route) => (route === "" ? "/" : route)),
		),
	];
}

/**
 * Does `declared` - a concrete path a spec navigates to - address `pattern`?
 *
 * By turning the pattern into a regex rather than by mapping concrete ids back to
 * parameter names. THAT is what broke the three previous versions: every new fixture id
 * had to be added to a lookup table, and a missing entry read as a missing scan. A
 * pattern match needs no table and cannot go stale.
 */
function addresses(pattern: string, declared: string): boolean {
	if (pattern === declared) return true;
	if (!pattern.includes("$")) return false;

	const regex = new RegExp(
		`^${pattern
			.split("/")
			.map((segment) =>
				segment.startsWith("$")
					? "[^/]+"
					: segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
			)
			.join("/")}$`,
	);
	return regex.test(declared);
}

/**
 * Routes whose accessibility scan lives somewhere other than the route table, and where.
 *
 * DECLARED, not inferred. The previous version grepped the spec directory for
 * `scanForViolations`, which missed `insights-accessibility.spec.ts` entirely because it
 * builds its own AxeBuilder - and so reported three scanned routes as unscanned.
 */
const COVERED_ELSEWHERE: Record<string, string> = {
	"/login": "accessibility.spec.ts",
	"/consortium/branding": "accessibility.spec.ts",
	"/hostlmss/new": "accessibility.spec.ts",
	"/libraries/$libraryId/branding": "accessibility.spec.ts",
	"/libraries/$libraryId/service": "accessibility.spec.ts",
	"/libraries/$libraryId/settings": "settings-inheritance.spec.ts",
	"/consortium/functionalSettings": "bulk-functional-settings.spec.ts",
	"/consortium/insights": "insights-accessibility.spec.ts",
	"/groups/$groupId/insights": "insights-accessibility.spec.ts",
	"/libraries/$libraryId/insights": "insights-accessibility.spec.ts",
	"/setup": "setup-accessibility.spec.ts",
	"/setup/$step": "setup-accessibility.spec.ts",
	"/setup/done": "setup-accessibility.spec.ts",
};

/** Routes deliberately not scanned, and the reason each one is not a gap. */
const NOT_SCANNED: Record<string, string> = {
	"/404":
		"rendered by createRouter's defaultNotFoundComponent, not reached as a route",
	"/500": "the crash screen; route-health asserts no route REACHES it",
	"/logout":
		"starts a real sign-out, so a scan would end every other test's session",
	"/search/$clusterId":
		"redirects in beforeLoad to /cluster, which is in ROUTES",
};

const declaredPaths = ROUTES.map((route) => route.path);

test("every navigable route is scanned, or excluded on the record", () => {
	const unaccounted = navigableRoutes().filter(
		(pattern) =>
			!declaredPaths.some((declared) => addresses(pattern, declared)) &&
			!(pattern in COVERED_ELSEWHERE) &&
			!(pattern in NOT_SCANNED),
	);

	expect(
		unaccounted,
		"add each to ROUTES, or to COVERED_ELSEWHERE naming the spec that scans it, or to NOT_SCANNED with a reason",
	).toEqual([]);
});

test("no exclusion names a route that no longer exists", () => {
	// A stale entry is how an exclusion list starts excusing a route nobody deleted.
	const routes = navigableRoutes();
	const stale = [
		...Object.keys(COVERED_ELSEWHERE),
		...Object.keys(NOT_SCANNED),
	].filter((pattern) => !routes.includes(pattern));

	expect(stale, "remove these from COVERED_ELSEWHERE / NOT_SCANNED").toEqual(
		[],
	);
});

test("every spec named as covering a route exists and runs axe", () => {
	// The guard on this guard. A name in COVERED_ELSEWHERE is a claim; this checks the
	// file is there and that it actually scans, by either route into axe.
	const notScanning = [...new Set(Object.values(COVERED_ELSEWHERE))].filter(
		(spec) => {
			let source: string;
			try {
				source = readFileSync(join("e2e", spec), "utf8");
			} catch {
				return true;
			}
			return !/scanForViolations|scanForLandmarks|AxeBuilder/.test(source);
		},
	);

	expect(notScanning, "named as scanning a route but does not run axe").toEqual(
		[],
	);
});

test("a route cannot be claimed twice", () => {
	// Being in ROUTES and in an exclusion list at once means one of them is a lie, and
	// whichever is read first wins silently.
	const routes = navigableRoutes();
	const doubleClaimed = routes.filter((pattern) => {
		const inRoutes = declaredPaths.some((declared) =>
			addresses(pattern, declared),
		);
		const claims =
			Number(inRoutes) +
			Number(pattern in COVERED_ELSEWHERE) +
			Number(pattern in NOT_SCANNED);
		return claims > 1;
	});

	expect(doubleClaimed, "claimed by more than one of the three").toEqual([]);
});
