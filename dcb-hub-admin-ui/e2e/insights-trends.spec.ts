import { test, expect } from "@playwright/test";

import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { enableInsights, mockInsights } from "./fixtures/insights-mocks";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import libraries from "./fixtures-data/libraries.json";

/**
 * Is it getting better or worse?
 *
 * The arithmetic is unit tested; what this covers is the wiring and the words - that a
 * direction reaches the reader as a SENTENCE and not only as a colour, and that the
 * duration trends are absent rather than broken on a deployment whose dcb-service does
 * not serve /insights/trend.
 */

const MOCKS = {
	LoadConsortiumHeader: consortiumBasics,
	LoadLibraries: libraries,
};

test.describe("Insights trends", () => {
	test("names the direction in words, not only in colour", async ({ page }) => {
		await enableInsights(page);
		await seedAuth(page);
		await mockInsights(page);
		await mockGraphQL(page, MOCKS);

		await page.goto("/consortium/insights?tab=trends");

		const strip = page
			.getByRole("heading", {
				level: 3,
				name: "Is it getting better or worse?",
			})
			.locator("xpath=ancestor::div[contains(@class,'MuiCard-root')][1]");

		await expect(strip).toBeVisible();

		// The fixture climbs from 78% to 89% filled and falls from 9% to 4% errored over
		// twelve closed buckets, so both rates have a direction and the volume does not.
		await expect(strip).toContainText("89.0%");
		await expect(strip).toContainText("4.0%");

		// Colour is never the only signal: the movement is a sentence.
		await expect(strip).toContainText("Up 4.0% on the preceding period");
		await expect(strip).toContainText("Down 2.0% on the preceding period");

		// Flat submissions read as no clear change rather than as an arrow on noise.
		await expect(strip).toContainText("No clear change");
	});

	test("says where a figure came from, by keyboard alone", async ({ page }) => {
		await enableInsights(page);
		await seedAuth(page);
		await mockInsights(page);
		await mockGraphQL(page, MOCKS);

		await page.goto("/consortium/insights?tab=trends");

		const trigger = page.getByRole("button", {
			name: "How Is it getting better or worse? is calculated",
		});

		// The three tiles beside it name the SAME figures as the headline above, so their
		// explanations have to be distinguishable by name alone - a reader listing the
		// page's controls hears only the name.
		await expect(
			page.getByRole("button", {
				name: "How Fill rate over time is calculated",
			}),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: "How Fill rate is calculated" }),
		).toHaveCount(1);
		await trigger.focus();
		await page.keyboard.press("Enter");

		const explanation = page.getByRole("dialog");
		// The rule itself, which is what makes an arrow mean anything.
		await expect(explanation).toContainText("most recent third");
		await expect(explanation).toContainText("no clear change");

		await page.keyboard.press("Escape");
		await expect(trigger).toBeFocused();
	});

	test("the duration trends are absent, not broken, without the endpoint", async ({
		page,
	}) => {
		// The flag off is what every deployment looks like today: /insights/trend is on
		// no dcb-service release. A 404 rendered through the panel contract would say
		// "this panel could not be loaded", which is a fault report for a server that is
		// simply older.
		await enableInsights(page);
		await seedAuth(page);
		await mockInsights(page);
		await mockGraphQL(page, MOCKS);

		const calls: string[] = [];
		page.on("request", (request) => {
			if (request.url().includes("/insights/trend")) calls.push(request.url());
		});

		await page.goto("/consortium/insights?tab=trends");
		await expect(
			page.getByRole("heading", {
				level: 3,
				name: "Is it getting better or worse?",
			}),
		).toBeVisible();

		await expect(
			page.getByRole("heading", { name: "How durations are moving" }),
		).toHaveCount(0);
		expect(calls).toEqual([]);
	});

	test("plots the three durations when the endpoint is there", async ({
		page,
	}) => {
		await enableInsights(page, { trends: true });
		await seedAuth(page);
		await mockInsights(page);
		await mockGraphQL(page, MOCKS);

		await page.goto("/consortium/insights?tab=trends");

		const panel = page
			.getByRole("heading", { level: 3, name: "How durations are moving" })
			.locator("xpath=ancestor::div[contains(@class,'MuiCard-root')][1]");

		// Below the fold, behind an IntersectionObserver.
		for (let i = 0; i < 10 && !(await panel.isVisible()); i++) {
			await page.mouse.wheel(0, 1200);
			await expect(page.locator("body")).toBeVisible();
		}

		await expect(panel).toBeVisible();
		await expect(
			panel.getByRole("button", { name: "Time to loan", exact: true }),
		).toBeVisible();

		// Switching duration asks the endpoint for a different metric from its OWN
		// vocabulary - never a column name and never caller text.
		const asked: string[] = [];
		page.on("request", (request) => {
			const url = new URL(request.url());
			if (url.pathname.endsWith("/insights/trend")) {
				asked.push(url.searchParams.get("metric") ?? "");
			}
		});

		await panel
			.getByRole("button", { name: "Time in transit", exact: true })
			.click();
		await expect.poll(() => asked).toContain("STATUS_DWELL");
	});
});
