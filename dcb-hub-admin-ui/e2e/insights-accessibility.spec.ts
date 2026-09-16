import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import axe from "axe-core";

import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { enableInsights, mockInsights } from "./fixtures/insights-mocks";
import { expectPaintedScheme } from "./fixtures/axe";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import libraries from "./fixtures-data/libraries.json";
import libraryDetail from "./fixtures-data/library-detail.json";
import groupDetail from "./fixtures-data/group-detail.json";

/** The library the fixtures describe; its Host LMS code is what scopes the panels. */
const LIBRARY = "c23df3ab-77c0-5689-b56d-fc8a2d6a5f22";

/** The group, whose two members scope the panels as a set. */
const GROUP = "aa11bb22-3333-5444-9555-666677778888";

const MOCKS = {
	LoadConsortiumHeader: consortiumBasics,
	LoadLibraries: libraries,
	LoadLibrary: libraryDetail,
	LoadGroup: groupDetail,
};

/**
 * The accessibility gate for Insights. WCAG 2.2 AA is the floor, and this is where it is
 * enforced rather than asserted: zero axe violations in BOTH colour schemes, because a
 * palette that passes in light routinely fails in dark - and this page is almost entirely
 * colour-bearing marks.
 *
 * ONE SCAN PER SUBJECT, not one per page. A subject that is not open does not render, so
 * a scan of the default view would cover one sixth of the feature while reporting clean -
 * which is the failure mode this suite exists to prevent, wearing a new shape.
 *
 * Automated rules catch roughly a third of WCAG failures. This is a floor, not a
 * certificate: keyboard completeness, focus order and announcement still need a human.
 */

const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/**
 * Outside the WCAG tag sets, asserted anyway because it caught something real: every KPI
 * tile label rendered as an <h6> directly under the page <h1>, because MUI's subtitle2 is
 * an <h6> element unless you say otherwise, and the accordion wrapped its summary in one
 * more. A screen-reader user navigating by heading met an outline claiming each tile sat
 * four levels deep inside nothing.
 *
 * Named one rule at a time rather than by enabling best-practice wholesale, so the gate
 * still cannot fail on opinion.
 */
const EXTRA_RULES = [
	"heading-order",
	// axe marks this EXPERIMENTAL, so the tag sets do not run it however many of them are
	// asked for - and it is tagged wcag21a. Lighthouse runs it, and caught a drill-down
	// link whose accessible name did not contain the figure painted on it: a voice-control
	// user says what they can see. Named explicitly so this gate meets it first next time.
	"label-content-name-mismatch",
];

/**
 * The subject, and the heading that proves its last panel has mounted.
 *
 * Gaps is absent from this table because it needs a single library in scope, which the
 * consortium view is not. It has its own scan, on the library route, below.
 */
const SUBJECTS = [
	{ tab: "trends", lastPanel: "Requesting activity over time" },
	{ tab: "service", lastPanel: "Peer benchmarking" },
	{ tab: "demand", lastPanel: "Demand nothing could supply" },
	{ tab: "partners", lastPanel: "Borrowing vs supplying" },
	{ tab: "collection", lastPanel: "Clustering confidence" },
] as const;

/**
 * The tag sets AND the extra rules, as one list of rule ids.
 *
 * NOT `.withTags(WCAG).withRules(EXTRA_RULES)`. Both of those set `runOnly`, so chaining
 * them does not combine - the second silently replaces the first, and this gate spent its
 * life asserting `heading-order` alone while reporting green on the whole WCAG ladder.
 * Lighthouse caught the aria-hidden-focus failure this missed, which is the only reason
 * anybody looked.
 */
const RULES = [
	...new Set([
		...axe.getRules(WCAG).map((rule) => rule.ruleId),
		...EXTRA_RULES,
	]),
];

async function scan(page: Page) {
	// Guards the gate: a rule list that has lost the tag sets is exactly what this file
	// looked like before, and it looked green.
	expect(RULES).toContain("color-contrast");
	expect(RULES).toContain("heading-order");
	expect(RULES.length).toBeGreaterThan(50);

	const results = await new AxeBuilder({ page }).withRules(RULES).analyze();

	expect(
		results.violations.map((v) => ({
			id: v.id,
			impact: v.impact,
			nodes: v.nodes.map((n) => n.target.join(" ")),
		})),
	).toEqual([]);
}

/**
 * Wheel to the bottom of the open subject and wait for its last panel.
 *
 * Below-the-fold panels mount on an IntersectionObserver, so a scan that did not scroll
 * would pass over unrendered placeholders. Waiting on a NAMED heading rather than a count
 * is what makes this deterministic: the panel either mounted or the test says which one
 * did not.
 */
async function revealSubject(page: Page, lastPanel: string) {
	await expect(
		page.getByRole("heading", { level: 2, name: "Overview" }),
	).toBeVisible();

	const target = page.getByRole("heading", { name: lastPanel });

	for (let i = 0; i < 14 && !(await target.isVisible()); i++) {
		await page.mouse.wheel(0, 1400);
		await expect(page.locator("body")).toBeVisible();
	}

	await expect(target).toBeVisible();
}

for (const scheme of ["light", "dark"] as const) {
	test.describe(`Insights - WCAG 2.2 AA - ${scheme} mode`, () => {
		test.use({ colorScheme: scheme });

		test.beforeEach(async ({ page }) => {
			await enableInsights(page);
			await seedAuth(page);
			await mockInsights(page);
			await mockGraphQL(page, MOCKS);
		});

		for (const { tab, lastPanel } of SUBJECTS) {
			test(`${tab} has no violations`, async ({ page }) => {
				await page.goto(`/consortium/insights?tab=${tab}`);
				await revealSubject(page, lastPanel);
				await scan(page);
			});
		}

		test("gaps has no violations", async ({ page }) => {
			// The sixth subject, and the only one the consortium view cannot show: it
			// answers "what does THIS library not hold", so it is scanned where it
			// renders rather than left to the five above.
			await page.goto(`/libraries/${LIBRARY}/insights?tab=gaps`);
			await revealSubject(page, "Consortial lifeline");
			await scan(page);
		});

		test("the duration trends have no violations", async ({ page }) => {
			// Behind a flag that is off everywhere today, so the default scans above do
			// not reach this panel at all - a chart with its own toggle group, which is
			// where focus order and unlabelled controls go wrong.
			await enableInsights(page, { trends: true });
			await page.goto("/consortium/insights?tab=trends");
			await revealSubject(page, "How durations are moving");
			await scan(page);
		});

		test("a group has no violations", async ({ page }) => {
			// The group route is the only place the subject bar sits under a TAB bar.
			// Two navigation strips stacked is where focus order and duplicated
			// accessible names go wrong, and neither of the other two routes has it.
			await page.goto(`/groups/${GROUP}/insights?tab=partners`);
			await revealSubject(page, "Borrowing vs supplying");
			await scan(page);
		});

		test("the emulated scheme actually reached the theme", async ({ page }) => {
			await page.goto("/consortium/insights");

			// After the app has painted, not after navigation: the theme is applied by
			// React, so reading `body` on the bare document measures the transparent
			// default and reports both schemes as dark.
			await expect(
				page.getByRole("heading", { level: 2, name: "Overview" }),
			).toBeVisible();

			expect(
				await page.evaluate(
					() => window.matchMedia("(prefers-color-scheme: dark)").matches,
				),
			).toBe(scheme === "dark");

			await expectPaintedScheme(page, scheme);
		});
	});
}

test.describe("Insights - structure", () => {
	test.beforeEach(async ({ page }) => {
		await enableInsights(page);
		await seedAuth(page);
		await mockInsights(page);
		await mockGraphQL(page, MOCKS);
	});

	test("is one h1, then the subject's own sections, then its panels", async ({
		page,
	}) => {
		await page.goto("/consortium/insights?tab=partners");

		// A screen-reader user navigates this page by heading. The open subject's
		// sections are the outline; the ones that are not open must not be in it, or the
		// outline promises content that is not on the page.
		await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);

		expect(
			await page.getByRole("heading", { level: 2 }).allTextContents(),
		).toEqual(["Overview", "Trading partners"]);
	});

	test("the subjects are links, and the open one says so", async ({ page }) => {
		await page.goto("/consortium/insights?tab=demand");

		const nav = page.getByRole("navigation", { name: "Insights subjects" });

		// Links, not tabs. The library page already owns a tablist, and a second one
		// inside the first gives a keyboard user two sets of arrow keys - see
		// docs/accessibility.md.
		await expect(nav.getByRole("link")).toHaveCount(5);
		await expect(nav.getByRole("link", { name: "Demand" })).toHaveAttribute(
			"aria-current",
			"page",
		);

		// Gaps needs one library in scope, so the consortium view does not offer it
		// rather than offering it empty.
		await expect(nav.getByRole("link", { name: "Gaps" })).toHaveCount(0);
	});

	test("a subject the scope cannot show falls back rather than blanking", async ({
		page,
	}) => {
		// An old link to Gaps, opened at consortium scope.
		await page.goto("/consortium/insights?tab=gaps");

		await expect(
			page.getByRole("heading", { level: 2, name: "Trends" }),
		).toBeVisible();
	});

	test("says how far the collection figures can be trusted", async ({
		page,
	}) => {
		await page.goto("/consortium/insights?tab=collection");
		await revealSubject(page, "Clustering confidence");

		// The single-holder share is the honesty check on every other number in the
		// section. The fixture is ~38% single-holder, which is a corpus that clusters,
		// so the figure shows and the warning does not.
		await expect(
			page.getByText(/of 4,120,884 works are held by a single library/),
		).toBeVisible();
		await expect(
			page.getByText(/records are not being matched to each other/),
		).toHaveCount(0);
	});
});
