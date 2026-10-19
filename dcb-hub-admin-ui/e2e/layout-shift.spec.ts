import { type Page } from "@playwright/test";
import { test, expect } from "./fixtures/test";

import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import { MOCKS, ROUTES } from "./fixtures/routes";

/**
 * Cumulative Layout Shift on every route this suite can render, at the tablet width where
 * the defects it guards against appear. Why 0.10 and why 768x1024:
 * docs/performance-budget.md, "Layout shift on every route".
 */

const CLS_BUDGET = 0.1;

const VIEWPORT = { width: 768, height: 1024 };

declare global {
	interface Window {
		__clsTotal: number;
		__clsShifts: number;
	}
}

/** Installed before the app's own scripts: a `goto` wipes anything set after it. */
async function observeLayout(page: Page) {
	await page.addInitScript(() => {
		window.__clsTotal = 0;
		window.__clsShifts = 0;

		new PerformanceObserver((list) => {
			for (const entry of list.getEntries() as (PerformanceEntry & {
				value: number;
				hadRecentInput: boolean;
			})[]) {
				if (entry.hadRecentInput) continue;
				window.__clsTotal += entry.value;
				window.__clsShifts += 1;
			}
		}).observe({ type: "layout-shift", buffered: true });
	});
}

/**
 * Settle on the shift COUNT rather than a fixed wait.
 *
 * `page.waitForTimeout` is banned here and rightly so, but a CLS reading is only
 * meaningful once shifting has stopped. Polling until the count repeats is the
 * auto-waiting form of the same thing, and it fails loudly on a page that never settles.
 */
async function waitForLayoutToSettle(page: Page) {
	let previous = -1;
	await expect
		.poll(
			async () => {
				const shifts = await page.evaluate(() => window.__clsShifts);
				const settled = shifts === previous;
				previous = shifts;
				return settled;
			},
			{ intervals: [250, 250, 250, 500, 500, 1000], timeout: 15_000 },
		)
		.toBe(true);
}

for (const route of ROUTES) {
	test(`${route.path} does not shift its layout on a tablet`, async ({
		page,
	}) => {
		await page.setViewportSize(VIEWPORT);
		await observeLayout(page);

		await seedAuth(page);
		await useAllFeatures(page);
		await mockGraphQL(page, MOCKS);
		await route.setup?.(page);
		await page.goto(route.path);

		// The route's own "my data has arrived" marker. A CLS reading taken before the
		// content lands is a reading of a spinner, which is always zero.
		await route.ready(page);
		await waitForLayoutToSettle(page);

		const cls = await page.evaluate(() => Number(window.__clsTotal.toFixed(4)));

		expect(
			cls,
			`cumulative layout shift at ${VIEWPORT.width}x${VIEWPORT.height}`,
		).toBeLessThanOrEqual(CLS_BUDGET);
	});
}
