import { type Page } from "@playwright/test";
import { test, expect } from "./fixtures/test";
import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import { MOCKS } from "./fixtures/routes";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import libraries from "./fixtures-data/libraries.json";

/**
 * A short page's footer sits at the foot of the viewport, and a long page's follows its
 * content. It used to sit a full viewport below the header on every page, which left
 * 417-697px of nothing under a two-row grid. docs/performance-budget.md, "Layout shift on
 * every route".
 */

const VIEWPORTS = [
	{ width: 1920, height: 1080 },
	{ width: 1280, height: 800 },
	{ width: 768, height: 1024 },
	{ width: 390, height: 844 },
];

/** Rounding, and the sidebar list's own bottom padding. The old layout misses by 400px+. */
const SLACK_PX = 16;

for (const viewport of VIEWPORTS) {
	test(`the footer follows a short grid at ${viewport.width}x${viewport.height}`, async ({
		page,
	}) => {
		await page.setViewportSize(viewport);
		await seedAuth(page);
		await mockGraphQL(page, {
			LoadConsortiumHeader: consortiumBasics,
			LoadLibraries: libraries,
		});
		await page.goto("/libraries");
		await expect(page.getByText("Alpha Test Library")).toBeVisible();

		// The docked sidebar is content too: at 1280x800 its links end below a two-row grid.
		const { contentBottom, footerTop, footerHeight } = await page.evaluate(
			() => {
				const bottomOf = (el: Element | null | undefined) =>
					el ? el.getBoundingClientRect().bottom + window.scrollY : 0;
				const footer = document.querySelector("footer")!;
				const row = footer.previousElementSibling!;
				const sidebarLinks = [...row.querySelectorAll("nav")].map((nav) =>
					bottomOf(nav.lastElementChild),
				);
				return {
					contentBottom: Math.max(
						bottomOf(document.querySelector(".MuiDataGrid-root")) + 24,
						...sidebarLinks,
					),
					footerTop: footer.getBoundingClientRect().top + window.scrollY,
					footerHeight: footer.getBoundingClientRect().height,
				};
			},
		);

		const atViewportFoot = viewport.height - footerHeight;
		expect(footerTop).toBeLessThanOrEqual(
			Math.max(contentBottom, atViewportFoot) + SLACK_PX,
		);
	});
}

test("the footer takes less than half a phone's viewport", async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await seedAuth(page);
	await mockGraphQL(page, {
		LoadConsortiumHeader: consortiumBasics,
		LoadLibraries: libraries,
	});
	await page.goto("/libraries");
	await expect(page.getByText("Alpha Test Library")).toBeVisible();

	const footerHeight = await page
		.locator("footer")
		.evaluate((footer) => footer.getBoundingClientRect().height);
	expect(footerHeight).toBeLessThan(844 / 2);
});

/**
 * The signed-out pages carry their own shell (LoginLayout). /login and /logout are not in
 * ROUTES, whose every entry signs in first, so layout-shift.spec.ts never measured them.
 */
declare global {
	interface Window {
		__clsTotal: number;
	}
}

const SIGNED_OUT = [
	{
		path: "/login",
		ready: (page: Page) =>
			expect(page.getByRole("heading", { level: 1 })).toBeVisible(),
	},
	{
		path: "/logout",
		ready: (page: Page) =>
			expect(page.getByRole("button", { name: "Login" })).toBeVisible(),
	},
	{
		path: "/maintenance",
		ready: (page: Page) =>
			expect(page.getByText("Maintenance in progress").first()).toBeVisible(),
	},
];

for (const route of SIGNED_OUT) {
	for (const viewport of VIEWPORTS) {
		test(`${route.path} keeps its footer under its content at ${viewport.width}x${viewport.height}`, async ({
			page,
		}) => {
			await page.setViewportSize(viewport);
			await page.addInitScript(() => {
				window.__clsTotal = 0;
				new PerformanceObserver((list) => {
					for (const entry of list.getEntries() as (PerformanceEntry & {
						value: number;
						hadRecentInput: boolean;
					})[]) {
						if (!entry.hadRecentInput) window.__clsTotal += entry.value;
					}
				}).observe({ type: "layout-shift", buffered: true });
			});
			await useAllFeatures(page);
			await mockGraphQL(page, MOCKS);
			await page.goto(route.path);
			await route.ready(page);
			await page.waitForLoadState("networkidle");

			const { contentBottom, footerTop, footerHeight, cls } =
				await page.evaluate(() => {
					const footer = document.querySelector("footer")!;
					const content = document.querySelector("main")!.firstElementChild!;
					return {
						contentBottom:
							content.getBoundingClientRect().bottom + window.scrollY,
						footerTop: footer.getBoundingClientRect().top + window.scrollY,
						footerHeight: footer.getBoundingClientRect().height,
						cls: window.__clsTotal,
					};
				});

			const atViewportFoot = viewport.height - footerHeight;
			expect(footerTop).toBeLessThanOrEqual(
				Math.max(contentBottom, atViewportFoot) + SLACK_PX,
			);
			expect(cls, "cumulative layout shift").toBeLessThanOrEqual(0.1);
		});
	}
}
