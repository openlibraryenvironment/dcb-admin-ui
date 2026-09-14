import { test, expect, type Page } from "@playwright/test";

import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { enableInsights, mockInsights } from "./fixtures/insights-mocks";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import libraries from "./fixtures-data/libraries.json";

/**
 * A panel that fails has to say so.
 *
 * Every panel here used to branch on the loading flag and then on the data, so a 500
 * rendered the "no data" copy - which is how /insights/dashboard-metrics returned 500 on
 * every consortium-wide call for a week while the trading partners panel reported no
 * activity and nobody read it as a fault.
 *
 * The assertions are deliberately on what the reader sees: the failure is named, a retry
 * is offered, and the empty-state sentence is NOT what they are shown.
 */

const FAILING_PANEL = "**/insights/failure-taxonomy**";

/** The card a heading belongs to, without reaching for an internal MUI class name. */
const cardFor = (page: Page, heading: string) =>
	page
		.getByRole("heading", { level: 3, name: heading })
		.locator("xpath=ancestor::*[self::div][.//h3][1]");

/**
 * Wheel down until the panel mounts. Below-the-fold panels render a placeholder until an
 * IntersectionObserver fires, so the heading does not exist to be scrolled to - which is
 * the same reason the accessibility spec wheels rather than scrolling to a locator.
 */
async function reveal(page: Page, heading: string) {
	const target = page.getByRole("heading", { level: 3, name: heading });

	for (let i = 0; i < 14 && !(await target.isVisible()); i++) {
		await page.mouse.wheel(0, 1200);
		await expect(page.locator("body")).toBeVisible();
	}

	await expect(target).toBeVisible();
}

test.describe("Insights panel states", () => {
	test.beforeEach(async ({ page }) => {
		await enableInsights(page);
		await seedAuth(page);
		await mockInsights(page);
		await mockGraphQL(page, {
			LoadConsortiumHeader: consortiumBasics,
			LoadLibraries: libraries,
		});
	});

	test("a failed panel says it failed, and offers a retry that works", async ({
		page,
	}) => {
		// Registered after mockInsights, so this one wins for its path only.
		let failNext = true;
		await page.route(FAILING_PANEL, async (route) => {
			if (failNext) {
				await route.fulfill({ status: 500, json: { message: "boom" } });
				return;
			}
			await route.fulfill({
				json: [{ reason: "NO_ITEMS_SELECTABLE", count: 148 }],
			});
		});

		await page.goto("/consortium/insights");

		await reveal(page, "Why requests fail");
		const panel = cardFor(page, "Why requests fail");

		// The message, not the role: this is what the reader is actually told, and the
		// global query client retries once, so the error state arrives after two round
		// trips rather than one.
		await expect(panel).toContainText("This panel could not be loaded.", {
			timeout: 15_000,
		});
		await expect(panel).not.toContainText("No data for the selected period.");

		failNext = false;
		await panel.getByRole("button", { name: "Retry" }).click();

		await expect(panel).not.toContainText("This panel could not be loaded.");
		await expect(panel.locator("svg").first()).toBeVisible();
	});

	test("an empty panel still reads as empty, not as broken", async ({
		page,
	}) => {
		await page.route(FAILING_PANEL, async (route) => {
			await route.fulfill({ json: [] });
		});

		await page.goto("/consortium/insights");

		await reveal(page, "Why requests fail");
		const panel = cardFor(page, "Why requests fail");

		await expect(panel).toContainText("No data for the selected period.");
		await expect(panel).not.toContainText("This panel could not be loaded.");
	});

	test("the header is five figures, and the rest are a disclosure away", async ({
		page,
	}) => {
		await page.goto("/consortium/insights");

		// Twelve equal tiles was an index, not a summary. The other seven are still
		// reachable, which is what makes this a hierarchy rather than a deletion.
		await expect(page.getByText("Libraries active")).toBeVisible();
		await expect(page.getByText("Estimated cost avoided")).toBeHidden();

		await page.getByRole("button", { name: "More measures" }).click();
		await expect(page.getByText("Estimated cost avoided")).toBeVisible();
	});

	test("the durations panel names both transit legs, and says when one is unreported", async ({
		page,
	}) => {
		await page.goto("/consortium/insights");
		await reveal(page, "How long things take");

		const panel = cardFor(page, "How long things take");

		// The outbound leg is reported by the fixture; the return leg is not, and the
		// difference has to be visible rather than drawn as an instant journey.
		await expect(panel).toContainText("Transit, outbound");
		await expect(panel).toContainText("PICKUP_TRANSIT");
		await expect(panel).toContainText("5233 observations");

		await expect(panel).toContainText("Transit, return");
		await expect(panel).toContainText("Not reported by this system");
	});

	test("the view change is announced once, not once per panel", async ({
		page,
	}) => {
		await page.goto("/consortium/insights");

		const live = page.locator('[aria-live="polite"]');
		await expect(live).toHaveCount(1);
		await expect(live).toHaveText("Showing 30 days for the whole consortium.");

		await page.getByRole("button", { name: "7 days" }).click();
		await expect(live).toHaveText("Showing 7 days for the whole consortium.");
	});
});
