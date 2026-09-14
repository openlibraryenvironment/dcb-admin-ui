import { test, expect } from "@playwright/test";

import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { enableInsights, mockInsights } from "./fixtures/insights-mocks";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import libraries from "./fixtures-data/libraries.json";

/**
 * The numbers on a panel, as a file.
 *
 * The composition is unit tested; what this covers is that the button is reachable, that
 * the download actually happens, and that the file states its scope and window - a CSV of
 * figures with no statement of what they cover becomes wrong the moment it is forwarded.
 */

const MOCKS = {
	LoadConsortiumHeader: consortiumBasics,
	LoadLibraries: libraries,
};

test.describe("Insights export", () => {
	test.beforeEach(async ({ page }) => {
		await enableInsights(page);
		await seedAuth(page);
		await mockInsights(page);
		await mockGraphQL(page, MOCKS);
	});

	test("a panel's figures download as a CSV that says what they are", async ({
		page,
	}) => {
		await page.goto("/consortium/insights?tab=demand&range=30d");

		const button = page.getByRole("button", {
			name: "Download Demand nothing could supply as CSV",
		});

		for (let i = 0; i < 12 && !(await button.isVisible()); i++) {
			await page.mouse.wheel(0, 1200);
			await expect(page.locator("body")).toBeVisible();
		}

		const download = page.waitForEvent("download");
		await button.click();
		const file = await download;

		// Named for the panel and the day, so a reader can tell two downloads apart.
		expect(file.suggestedFilename()).toMatch(
			/^demand-nothing-could-supply-\d{4}-\d{2}-\d{2}\.csv$/,
		);

		const stream = await file.createReadStream();
		const chunks: Buffer[] = [];
		for await (const chunk of stream) chunks.push(Buffer.from(chunk));
		const csv = Buffer.concat(chunks).toString("utf8");

		// The preamble is the point: what it is, what it covers, when it was taken.
		expect(csv).toContain("Demand nothing could supply");
		expect(csv).toContain("Scope,the whole consortium");
		expect(csv).toContain("Period,30 days");
		expect(csv).toMatch(/Generated,\d{4}-\d{2}-\d{2}T/);

		// Then the table, with the row that was on screen.
		expect(csv).toContain("A book nobody holds");
	});

	test("the export button is named for its panel, not just Download", async ({
		page,
	}) => {
		await page.goto("/consortium/insights?tab=demand");

		// A reader listing this page's controls would otherwise hear the same word beside
		// every figure on it.
		const generic = page.getByRole("button", { name: "Download", exact: true });
		await expect(generic).toHaveCount(0);
	});

	test("a chart offers the image export the licence already covers", async ({
		page,
	}) => {
		await page.goto("/consortium/insights?tab=service");

		const chart = page
			.getByRole("heading", { level: 3, name: "Why requests fail" })
			.locator("xpath=ancestor::div[contains(@class,'MuiCard-root')][1]");

		for (let i = 0; i < 12 && !(await chart.isVisible()); i++) {
			await page.mouse.wheel(0, 1200);
			await expect(page.locator("body")).toBeVisible();
		}

		// MUI X Premium ships these triggers and nothing in this application used them.
		// A picture for a slide is a different need from the numbers. Each carries its own
		// name: the icon is the only other thing in the button.
		await expect(
			chart.getByRole("button", { name: "Download this chart as an image" }),
		).toBeVisible();
		await expect(
			chart.getByRole("button", { name: "Print this chart" }),
		).toBeVisible();

		// NOT the stock pro toolbar, which also renders zoom controls these charts cannot
		// use - and renders their labels on a span, where aria-label is prohibited.
		await expect(chart.getByRole("button", { name: /zoom/i })).toHaveCount(0);
	});
});
