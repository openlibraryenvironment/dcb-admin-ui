import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import { join, resolve, sep } from "path";

/**
 * Every tab that navigates is a link — the invariant, not one instance of it.
 *
 * Six tab bars in this application navigate between routes, and all six were `<Tab>`
 * buttons with an `onChange` calling `router.navigate`: no href, so a middle-click, a
 * ctrl-click, "open in new tab" and "copy link address" all silently did nothing.
 *
 * The e2e suite proves three of them work (consortium, library detail, patron requests).
 * It cannot cheaply prove the other three, because reaching a groups or mappings tab bar
 * means mocking that page's data for the sake of an assertion about markup. This asserts
 * the property at the source instead, which is also where the regression will happen:
 * somebody adds a seventh tab bar by copying a sixth, and copies `<Tab>`.
 *
 * `<Tab>` is not banned outright — the patron request DETAIL page uses tabs correctly, to
 * switch panels within one document, and those are buttons because that is what the tab
 * pattern is for. The rule is narrower and matches the actual defect: a file that
 * navigates must not also render a plain `<Tab>`.
 */
const SRC = resolve(__dirname, "..");

/** Repo-relative and forward-slashed, so a failure reads the same on either platform. */
const relative = (path: string) =>
	path
		.slice(SRC.length + 1)
		.split(sep)
		.join("/");

function tsxFiles(dir: string): string[] {
	return readdirSync(dir).flatMap((entry) => {
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) return tsxFiles(full);
		return entry.endsWith(".tsx") && !entry.endsWith(".test.tsx") ? [full] : [];
	});
}

/** Files that render a tab bar of any kind. */
const tabBars = tsxFiles(SRC)
	.map((path) => ({ path, source: readFileSync(path, "utf8") }))
	.filter(({ source }) => /<Tabs[\s>]|<TabList[\s>]/.test(source));

describe("tab bars", () => {
	it("finds the tab bars it is meant to be checking", () => {
		// Guards the test: a glob that matched nothing would pass everything below.
		expect(tabBars.length).toBeGreaterThanOrEqual(6);
	});

	/**
	 * Files that legitimately render a `<Tab>` that is not a link. Two, both real.
	 *
	 * Kept as an explicit list rather than a cleverer heuristic: the distinction is
	 * "do these tabs change the URL", which no regex can see. A list of two with a
	 * reason each is honest; a rule that guesses would eventually guess wrong and be
	 * silently widened.
	 */
	const NOT_NAVIGATION = new Map([
		[
			"components/TabLink/TabLink.tsx",
			"defines the wrapper; its doc comment is what matches",
		],
		[
			"routes/__authenticated/patronRequests/$id/index.tsx",
			"switches panels within one document - the tab pattern used correctly, so these are buttons on purpose",
		],
	]);

	it("lists only exceptions that still exist", () => {
		// An allow-list outlives what it excuses unless something says so.
		const paths = tabBars.map(({ path }) => relative(path));
		for (const excused of NOT_NAVIGATION.keys()) {
			expect(paths, `${excused} no longer renders a tab bar`).toContain(
				excused,
			);
		}
	});

	it("renders navigating tabs as links, never as bare Tab buttons", () => {
		const offenders = tabBars
			.filter(({ path }) => !NOT_NAVIGATION.has(relative(path)))
			.filter(({ source }) => {
				// A bar that navigates: it either uses the router directly or hands its
				// tabs a destination.
				const navigates =
					/useNavigate|router\.navigate|handleTabChange|<TabLink/.test(source);
				// A plain <Tab ...> element rendered in the same file.
				// `[\s>]` is what excludes `<TabLink` - after "Tab" comes "L", not a
				// space or a closing bracket.
				const hasBareTab = /<Tab[\s>]/.test(source);
				return navigates && hasBareTab;
			})
			.map(({ path }) => relative(path));

		expect(offenders).toEqual([]);
	});

	it("gives every TabLink a destination as well as a value", () => {
		// `value` drives which tab looks selected; `to` drives where it goes. A TabLink
		// with only `value` renders an anchor with no href, which looks correct and is
		// the exact defect this whole change removed.
		const offenders: string[] = [];

		for (const { path, source } of tabBars) {
			for (const element of source.match(/<TabLink[\s\S]*?\/>/g) ?? []) {
				if (!/\bto=/.test(element)) {
					offenders.push(relative(path));
				}
			}
		}

		expect(offenders).toEqual([]);
	});
});
