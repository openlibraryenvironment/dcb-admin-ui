import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { enableInsights, mockInsights } from "./fixtures/insights-mocks";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import libraries from "./fixtures-data/libraries.json";

/**
 * The accessibility gate for Insights. WCAG 2.2 AA is the floor, and this is where it is
 * enforced rather than asserted: zero axe violations on the dashboard in BOTH colour
 * schemes, because a palette that passes in light routinely fails in dark - and this page
 * is almost entirely colour-bearing marks.
 *
 * The whole page is scanned, not the fold: every panel below the first screen is mounted
 * by an IntersectionObserver, so the scan scrolls to the bottom first and waits for the
 * last section to arrive. A gate that only ever saw the KPI row would pass over twenty
 * unscanned charts and tables.
 *
 * Automated rules catch roughly a third of WCAG failures. This is a floor, not a
 * certificate: keyboard completeness, focus order and announcement still need a human.
 */

const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/**
 * The one exclusion, and it is a library defect rather than ours.
 *
 * @mui/x-charts 9.9.0 mounts ChartsAccessibilityProxy whenever keyboard navigation is on
 * (the default). It creates two `role="img"` divs whose `aria-labelledby` points at two
 * sibling divs that stay EMPTY until a keyboard interaction produces a description - so
 * every chart on the page reports role-img-alt while idle, in our markup and in anyone
 * else's. Nothing we can pass to the chart names them; `title` labels the container and
 * `desc` fills a different hidden span.
 *
 * Excluding by that id prefix is narrow enough that it can only ever match those internal
 * divs. Our own charts still have to be named: each is wrapped in a labelled role="img"
 * container, which this scan does see.
 *
 * Remove the exclusion when x-charts is next upgraded and this comes back green without
 * it. Do NOT widen it - disabling keyboard navigation would silence the rule by removing
 * the accessibility feature that caused it.
 */
const MUI_CHART_PROXY = '[aria-labelledby^="voiceover-"]';

async function scanWholePage(page: Page) {
	const results = await new AxeBuilder({ page })
		.withTags(WCAG)
		.exclude(MUI_CHART_PROXY)
		.analyze();

	expect(
		results.violations.map((v) => ({
			id: v.id,
			impact: v.impact,
			nodes: v.nodes.map((n) => n.target.join(" ")),
		})),
	).toEqual([]);
}

/**
 * Mount every lazy panel, then wait for the last section on the page.
 *
 * Collection analysis is deliberately last and deliberately lazy, so its heading arriving
 * is the signal that nothing is still an unrendered placeholder.
 */
async function revealEveryPanel(page: Page) {
	await expect(
		page.getByRole("heading", { level: 2, name: "Overview" }),
	).toBeVisible();

	for (let i = 0; i < 12; i++) {
		await page.mouse.wheel(0, 2000);
	}

	await expect(
		page.getByRole("heading", { level: 2, name: "Collection analysis" }),
	).toBeVisible();
	await expect(
		page.getByRole("heading", { level: 3, name: "Clustering confidence" }),
	).toBeVisible();
	await expect(
		page.getByRole("heading", { level: 3, name: "Trading partners" }),
	).toBeVisible();
}

for (const scheme of ["light", "dark"] as const) {
	test.describe(`Insights - WCAG 2.2 AA - ${scheme} mode`, () => {
		test.use({ colorScheme: scheme });

		test.beforeEach(async ({ page }) => {
			await enableInsights(page);
			await seedAuth(page);
			await mockInsights(page);
			await mockGraphQL(page, {
				LoadConsortiumHeader: consortiumBasics,
				LoadLibraries: libraries,
			});
		});

		test("consortium insights has no violations", async ({ page }) => {
			await page.goto("/consortium/insights");
			await revealEveryPanel(page);

			// Guards the gate itself. useThemeStore seeds its mode from
			// prefers-color-scheme, so if the emulated scheme never reached the app a
			// "passing" dark run would just be a second light run. Asserting the media
			// query alone would not prove that either - the theme has to have followed
			// it - so this reads the painted background and checks it is on the right
			// side of mid-grey.
			const painted = await page.evaluate(() => {
				const [r, g, b] = getComputedStyle(document.body)
					.backgroundColor.match(/\d+/g)!
					.map(Number);
				return {
					prefersDark: window.matchMedia("(prefers-color-scheme: dark)")
						.matches,
					luminance: (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255,
				};
			});

			expect(painted.prefersDark).toBe(scheme === "dark");
			if (scheme === "dark") {
				expect(painted.luminance).toBeLessThan(0.5);
			} else {
				expect(painted.luminance).toBeGreaterThan(0.5);
			}

			await scanWholePage(page);
		});
	});
}

test.describe("Insights - structure", () => {
	test.beforeEach(async ({ page }) => {
		await enableInsights(page);
		await seedAuth(page);
		await mockInsights(page);
		await mockGraphQL(page, {
			LoadConsortiumHeader: consortiumBasics,
			LoadLibraries: libraries,
		});
	});

	test("is one h1, then sections, then panels - in that order", async ({
		page,
	}) => {
		await page.goto("/consortium/insights");
		await revealEveryPanel(page);

		// A screen-reader user navigates this page by heading. Twenty sibling cards with
		// no sections between them is a list, not an outline.
		await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);

		const sections = await page
			.getByRole("heading", { level: 2 })
			.allTextContents();

		expect(sections).toEqual([
			"Overview",
			"Service performance",
			"Demand",
			"Trading partners",
			"Collection analysis",
		]);

		// Every section is a landmark named by its own heading, so it can be jumped to.
		await expect(
			page.getByRole("region", { name: "Collection analysis" }),
		).toBeVisible();
	});

	test("says how far the collection figures can be trusted", async ({
		page,
	}) => {
		await page.goto("/consortium/insights");
		await revealEveryPanel(page);

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
