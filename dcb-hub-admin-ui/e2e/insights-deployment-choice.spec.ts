import type { Page } from "@playwright/test";

import { test, expect } from "./fixtures/test";
import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { enableInsights, mockInsights } from "./fixtures/insights-mocks";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import groupDetail from "./fixtures-data/group-detail.json";
import libraries from "./fixtures-data/libraries.json";

// VITE_INSIGHTS_PAGES and VITE_INSIGHTS_PANELS: docs/deployment.md, 2b

const GROUP = "aa11bb22-3333-5444-9555-666677778888";

/** Adds settings to what enableInsights seeded, as a deployment's environment would. */
async function configure(page: Page, settings: Record<string, string>) {
	await page.addInitScript((values: Record<string, string>) => {
		window.__APP_ENV__ = {
			...(window.__APP_ENV__ ?? {}),
			...values,
		} as Window["__APP_ENV__"];
	}, settings);
}

/** Wheel down until a below-the-fold panel mounts. */
async function reveal(page: Page, heading: string) {
	const target = page.getByRole("heading", { level: 3, name: heading });
	for (let i = 0; i < 14 && !(await target.isVisible()); i++) {
		await page.mouse.wheel(0, 1200);
		await expect(page.locator("body")).toBeVisible();
	}
	await expect(target).toBeVisible();
}

test.describe("A deployment's choice of Insights pages and panels", () => {
	test.beforeEach(async ({ page }) => {
		await enableInsights(page);
		await seedAuth(page);
		await mockInsights(page);
		await mockGraphQL(page, {
			LoadConsortiumHeader: consortiumBasics,
			LoadLibraries: libraries,
			LoadGroup: groupDetail,
		});
	});

	test("leaves out a subject and a panel, and a link to the subject opens another", async ({
		page,
	}) => {
		await configure(page, {
			VITE_INSIGHTS_PANELS: "all,-partners,-service.peerBenchmark",
		});
		await page.goto("/consortium/insights?tab=service");

		const nav = page.getByRole("navigation", { name: "Insights subjects" });
		await expect(nav.getByRole("link", { name: "Service" })).toBeVisible();
		await expect(nav.getByRole("link", { name: "Partners" })).toHaveCount(0);

		// Below where peer benchmarking sat: had it been shown, it would have mounted first
		await reveal(page, "Why requests fail");
		await expect(
			page.getByRole("heading", { name: "Peer benchmarking" }),
		).toHaveCount(0);

		await page.goto("/consortium/insights?tab=partners");
		await expect(nav.getByRole("link", { name: "Trends" })).toHaveAttribute(
			"aria-current",
			"page",
		);
	});

	test("leaves out a group's Insights tab and refuses a typed link to it", async ({
		page,
	}) => {
		await configure(page, { VITE_INSIGHTS_PAGES: "all,-groups" });
		await page.goto(`/groups/${GROUP}/insights`);

		await expect(page).toHaveURL((url) => url.pathname === `/groups/${GROUP}`);
		await expect(
			page.getByRole("heading", { level: 1, name: "Midlands Group" }),
		).toBeVisible();
		await expect(page.getByRole("tab", { name: "Insights" })).toHaveCount(0);
	});
});
