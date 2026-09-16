import { test, expect } from "@playwright/test";

import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { enableInsights, mockInsights } from "./fixtures/insights-mocks";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import groupDetail from "./fixtures-data/group-detail.json";

/**
 * Insights for a group.
 *
 * A group is a set of Host LMS codes and every scoped endpoint already takes a set, so this
 * page is the existing dashboard handed the codes the group query already returns. What is
 * worth testing is therefore not the panels - they are covered elsewhere - but that the
 * codes reaching the API are the group's, and only the group's.
 */

const GROUP = "aa11bb22-3333-5444-9555-666677778888";

const MOCKS = {
	LoadConsortiumHeader: consortiumBasics,
	LoadGroup: groupDetail,
};

/** Every Insights call the page makes, as URLs, so the scope can be read off them. */
function trackInsights(page: import("@playwright/test").Page) {
	const seen: URL[] = [];
	page.on("request", (request) => {
		const url = new URL(request.url());
		if (url.pathname.includes("/insights/")) seen.push(url);
	});
	return seen;
}

test.describe("Group insights", () => {
	test.beforeEach(async ({ page }) => {
		await enableInsights(page);
		await seedAuth(page);
		await mockInsights(page);
		await mockGraphQL(page, MOCKS);
	});

	test("scopes every statistics call to the group's own member codes", async ({
		page,
	}) => {
		const calls = trackInsights(page);

		await page.goto(`/groups/${GROUP}/insights`);
		await expect(
			page.getByRole("heading", { level: 2, name: "Overview" }),
		).toBeVisible();

		await expect.poll(() => calls.length).toBeGreaterThan(0);

		// The two members' Host LMS codes, as a set - not one of them, and not the
		// consortium. A call that carried a narrower scope would answer a different
		// question under the group's name, and nothing on the page would say so.
		for (const url of calls) {
			const code = url.searchParams.get("requestedLibraryCode");
			if (code !== null) expect(code).toBe("alpha-lms,beta-lms");
		}

		// At least one call must actually be scoped: a page that scoped nothing would
		// pass the loop above vacuously and show the whole consortium's figures.
		expect(
			calls.some(
				(url) =>
					url.searchParams.get("requestedLibraryCode") === "alpha-lms,beta-lms",
			),
		).toBe(true);
	});

	test("the group's name is the page, and the tab bar says where you are", async ({
		page,
	}) => {
		await page.goto(`/groups/${GROUP}/insights`);

		await expect(
			page.getByRole("heading", { level: 1, name: "Midlands Group" }),
		).toBeVisible();

		await expect(
			page.getByRole("tab", { name: "Insights", selected: true }),
		).toBeVisible();
	});

	test("Gaps is not offered for a group of two libraries", async ({ page }) => {
		await page.goto(`/groups/${GROUP}/insights`);

		const nav = page.getByRole("navigation", { name: "Insights subjects" });

		// Its panels ask "what does THIS library not hold". Across a set the four
		// queries behind them change meaning rather than narrowing, so the subject is
		// hidden rather than shown answering a different question.
		await expect(nav.getByRole("link", { name: "Gaps" })).toHaveCount(0);
		await expect(nav.getByRole("link")).toHaveCount(5);
	});

	test("the subject is in the URL here too", async ({ page }) => {
		await page.goto(`/groups/${GROUP}/insights?tab=partners`);

		await expect(
			page.getByRole("heading", { level: 2, name: "Trading partners" }),
		).toBeVisible();

		const nav = page.getByRole("navigation", { name: "Insights subjects" });
		await nav.getByRole("link", { name: "Demand" }).click();

		await expect(page).toHaveURL(/tab=demand/);
		await expect(
			page.getByRole("heading", { level: 2, name: "Demand" }),
		).toBeVisible();
	});

	test("is unreachable while the feature flag is off", async ({ page }) => {
		// A second context: the flag is seeded before any app script runs, so it has to
		// be turned off the same way rather than unset afterwards.
		await page.addInitScript(() => {
			(window as any).__APP_ENV__ = {
				...((window as any).__APP_ENV__ ?? {}),
				VITE_FEATURE_INSIGHTS: "false",
			};
		});

		await page.goto(`/groups/${GROUP}/insights`);

		// Redirected to the group's profile rather than calling statistics endpoints
		// this deployment's dcb-service may not serve.
		await expect(page).toHaveURL(new RegExp(`/groups/${GROUP}$`));
	});
});
