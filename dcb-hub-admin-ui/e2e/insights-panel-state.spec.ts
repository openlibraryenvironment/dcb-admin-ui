import { type Page } from "@playwright/test";
import { test, expect } from "./fixtures/test";

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

/**
 * The card a heading belongs to.
 *
 * MuiCard-root, not an ancestor-with-a-heading walk: once a heading is wrapped alongside
 * its info button, the nearest ancestor holding it is that wrapper rather than the panel,
 * and the locator silently starts matching two elements instead of the card. This is one
 * of MUI's DOCUMENTED class names, which is the distinction the doctrine draws - a css-
 * hash is not.
 */
const cardFor = (page: Page, heading: string) =>
	page
		.getByRole("heading", { level: 3, name: heading })
		.locator("xpath=ancestor::div[contains(@class,'MuiCard-root')][1]");

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

		await page.goto("/consortium/insights?tab=service");

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

	test("a collection count that outlives the proxy says it is still counting, then answers", async ({
		page,
	}) => {
		// dcb-service keeps the shared pass running when the proxy gives up, so a 504 here
		// means "not yet", and the panel asks again on its own rather than reporting a fault.
		let timedOut = 0;
		await page.route("**/insights/collection-totals**", async (route) => {
			if (timedOut++ === 0) {
				await route.fulfill({ status: 504, body: "" });
				return;
			}
			await route.fulfill({
				json: {
					distinctTitles: 4_120_884,
					singlyHeldTitles: 1_902_311,
					holdings: 7_884_002,
					contributingSources: 42,
				},
			});
		});
		await page.clock.install();

		await page.goto("/consortium/insights?tab=collection");

		const computing = page.getByText("Counting across the whole catalogue.");
		for (let i = 0; i < 14 && !(await computing.isVisible()); i++) {
			await page.mouse.wheel(0, 600);
			await expect(page.locator("body")).toBeVisible();
		}
		await expect(computing).toBeVisible();
		await expect(
			page.getByText("The collection figures could not be loaded."),
		).toHaveCount(0);

		// The first retry is 20 seconds out; nobody should have to wait for it in a test.
		await page.clock.fastForward(21_000);

		await expect(page.getByText("4,120,884", { exact: true })).toBeVisible();
		expect(timedOut).toBe(2);
	});

	test("a chosen date range shows as two labelled fields, and Clear returns to the preset", async ({
		page,
	}) => {
		await page.goto("/consortium/insights?from=2026-09-01&to=2026-09-15");

		const from = page.getByRole("group", { name: "From" });
		const to = page.getByRole("group", { name: "To" });
		await expect(from.getByRole("spinbutton", { name: "Day" })).toHaveText(
			"01",
		);
		await expect(to.getByRole("spinbutton", { name: "Day" })).toHaveText("15");

		await from.click();
		await page.getByRole("button", { name: "Clear" }).click();

		await expect(page).not.toHaveURL(/from=/);
		await expect(page.getByRole("button", { name: "30 days" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
	});

	test("a range chosen in the calendar reaches the URL, and the endpoints get the whole of both days", async ({
		page,
	}) => {
		// The picker reports the two ends in SEPARATE onChange calls. A parent that only
		// accepted a complete pair therefore discarded the first click, and because the
		// value handed back was a fresh array, the field re-derived its sections from the
		// emptied value and wiped what was already there - so no range could be entered at
		// all, by calendar or by keyboard.
		const windows: { start: string | null; end: string | null }[] = [];
		page.on("request", (request) => {
			const url = new URL(request.url());
			if (!url.pathname.endsWith("/insights/dashboard")) return;
			windows.push({
				start: url.searchParams.get("startDate"),
				end: url.searchParams.get("endDate"),
			});
		});

		await page.goto("/consortium/insights");

		// The multi-input field opens the calendar on focus; it has no adornment button.
		await page.getByRole("group", { name: "From" }).click();
		await expect(page.getByRole("button", { name: "Clear" })).toBeVisible();
		// `disableFuture` is on, so step back to a month that is entirely in the past.
		await page.getByRole("button", { name: /Previous month/ }).click();

		const day = (name: string) =>
			page
				.getByRole("gridcell", { name, exact: true })
				.and(page.locator("button:not([disabled])"))
				.first();

		// The day numbers rather than literal dates: this suite runs on whatever today is.
		await day("10").click();
		// The first end alone is kept - that is the whole bug - and it reads as chosen.
		await expect(page).toHaveURL(/from=\d{4}-\d{2}-10(&|$)/);
		await expect(day("10")).toHaveAttribute("aria-selected", "true");

		await day("20").click();
		await expect(page).toHaveURL(/to=\d{4}-\d{2}-20(&|$)/);

		// The URL says the days; the endpoints bind an Instant. Midnight of the first to
		// the end of the last, in the reader's own zone - a window that stopped at the
		// start of the 20th would drop that whole day.
		await expect(() => {
			const last = windows.at(-1);
			expect(last?.start).toMatch(
				/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
			);
			const days =
				(Date.parse(last!.end!) - Date.parse(last!.start!)) / 86_400_000;
			expect(days).toBeGreaterThan(10.9);
			expect(days).toBeLessThan(11.1);
		}).toPass();
	});

	test("the date fields read in the reader's order, not the adapter's default", async ({
		page,
	}) => {
		// AdapterDayjs takes its keyboardDate format from dayjs's localized `L` token and
		// dayjs defaults to `en`, so without a locale these fields read MM/DD/YYYY on a
		// page whose every other date is "1 Sep 2026" - and 09/01/2026 is a different day
		// to a British reader than to the control.
		await page.goto("/consortium/insights");

		const sections = page
			.getByRole("group", { name: "From" })
			.getByRole("spinbutton");

		await expect(sections.nth(0)).toHaveAccessibleName("Day");
		await expect(sections.nth(1)).toHaveAccessibleName("Month");
		await expect(sections.nth(2)).toHaveAccessibleName("Year");
	});

	test("a library chosen in the selector stays chosen, and survives a reload", async ({
		page,
	}) => {
		await page.goto("/consortium/insights");

		await page.getByRole("combobox", { name: "Libraries" }).click();
		await page.getByRole("option", { name: "Alpha Test Library" }).click();

		const chip = page.getByRole("button", { name: "Alpha Test Library" });
		await expect(chip).toBeVisible();
		await expect(page).toHaveURL(/scope=/);

		await page.reload();
		await expect(chip).toBeVisible();
	});

	test("a scoped link asks for that library's figures, and only those", async ({
		page,
	}) => {
		// What a shared or bookmarked scoped link used to do: the URL names a library by
		// id, the endpoints take Host LMS codes, and the list that maps one to the other
		// was fetched by the selector AFTER the first render - so the dashboard asked for
		// the whole consortium, showed those figures, and then corrected itself. Two calls,
		// the wasted one being the most expensive query the service runs, and a reader who
		// glanced at the header saw somebody else's numbers.
		const windows: (string | null)[] = [];
		page.on("request", (request) => {
			const url = new URL(request.url());
			if (!url.pathname.endsWith("/insights/dashboard")) return;
			windows.push(url.searchParams.get("requestedLibraryCode"));
		});

		await page.goto(
			"/consortium/insights?scope=library:c23df3ab-77c0-5689-b56d-fc8a2d6a5f22",
		);

		// The chip is the selection restored from the URL, so the page has settled.
		await expect(
			page.getByRole("button", { name: "Alpha Test Library" }),
		).toBeVisible();
		await expect(page.locator('[data-tid="insights-announcement"]')).toHaveText(
			"Showing 30 days for 1 library.",
		);

		// Every call for the header figures carried the library. Asserted as "no call was
		// unscoped" rather than as a count, because what matters is that the consortium
		// was never asked - a cache hit more or less is not the defect.
		expect(windows.length).toBeGreaterThan(0);
		expect(windows.filter((code) => code !== "alpha-lms")).toEqual([]);
	});

	test("trading partners says it failed, rather than that there were no partners", async ({
		page,
	}) => {
		let failNext = true;
		await page.route("**/insights/top-partners**", async (route) => {
			if (failNext) {
				await route.fulfill({ status: 500, json: { message: "boom" } });
				return;
			}
			await route.fallback();
		});

		await page.goto(
			"/consortium/insights?tab=partners&scope=library:c23df3ab-77c0-5689-b56d-fc8a2d6a5f22",
		);

		await reveal(page, "Trading partners");
		const panel = cardFor(page, "Trading partners");

		await expect(panel).toContainText("This panel could not be loaded.", {
			timeout: 15_000,
		});
		await expect(panel).not.toContainText("No data for the selected period.");

		failNext = false;
		await panel.getByRole("button", { name: "Retry" }).click();

		await expect(panel).not.toContainText("This panel could not be loaded.");
	});

	test("an empty panel still reads as empty, not as broken", async ({
		page,
	}) => {
		await page.route(FAILING_PANEL, async (route) => {
			await route.fulfill({ json: [] });
		});

		await page.goto("/consortium/insights?tab=service");

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
		await page.goto("/consortium/insights?tab=service");
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

	test("a figure explains where it came from, by keyboard alone", async ({
		page,
	}) => {
		await page.goto("/consortium/insights");

		// Named for its metric, not "info": a screen-reader user listing the buttons on
		// this page would otherwise hear the same word twenty times.
		const trigger = page.getByRole("button", {
			name: "How Fill rate is calculated",
		});
		await expect(trigger).toBeVisible();

		// Click, not hover. Four paragraphs behind a tooltip meets none of the
		// dismissable, hoverable, persistent requirements of WCAG 2.2 SC 1.4.13.
		await trigger.focus();
		await page.keyboard.press("Enter");

		const popover = page.getByRole("dialog", {
			name: "How Fill rate is calculated",
		});
		await expect(popover).toBeVisible();
		await expect(popover).toContainText("What it counts");
		await expect(popover).toContainText("What it does not include");

		// Escape closes it and focus comes back to the control that opened it, so the
		// keyboard user is not dropped at the top of the document.
		await page.keyboard.press("Escape");
		await expect(popover).toBeHidden();
		await expect(trigger).toBeFocused();
	});

	test("a money figure says which half of it is an assumption", async ({
		page,
	}) => {
		await page.goto("/consortium/insights");
		await page.getByRole("button", { name: "More measures" }).click();

		await page
			.getByRole("button", { name: "How Estimated cost avoided is calculated" })
			.click();

		const popover = page.getByRole("dialog");
		await expect(popover).toContainText("assumption multiplied by a count");
		await expect(popover).toContainText("the unit cost is yours");
	});

	test("a link carries the whole view, and survives a reload and the back button", async ({
		page,
	}) => {
		// The thing that did not work before: this URL opened on somebody else's default,
		// because the range and the plotted series lived in a store.
		await page.goto(
			"/consortium/insights?range=90d&series=LOANED&unitCost=17.5",
		);

		const live = page.locator('[data-tid="insights-announcement"]');
		await expect(live).toHaveText("Showing 90 days for the whole consortium.");

		await page.reload();
		await expect(live).toHaveText("Showing 90 days for the whole consortium.");

		// Changing a control writes to the URL rather than to a store.
		await page.getByRole("button", { name: "7 days" }).click();
		await expect(page).toHaveURL(/range=7d/);
		await expect(live).toHaveText("Showing 7 days for the whole consortium.");

		// replace: true, so the range control does not fill the reader's history - going
		// back leaves the page rather than stepping through every range they tried.
		await page.goBack();
		await expect(page).not.toHaveURL(/\/consortium\/insights/);
	});

	test("a junk URL degrades to a view rather than an error", async ({
		page,
	}) => {
		await page.goto(
			"/consortium/insights?range=forever&from=last%20tuesday&series=%3Cscript%3E",
		);

		const live = page.locator('[data-tid="insights-announcement"]');
		await expect(live).toHaveText("Showing 30 days for the whole consortium.");
		await expect(
			page.getByRole("heading", { level: 1, name: "Consortium insights" }),
		).toBeVisible();
	});

	test("the view change is announced once, not once per panel", async ({
		page,
	}) => {
		await page.goto("/consortium/insights");

		const live = page.locator('[data-tid="insights-announcement"]');
		await expect(live).toHaveCount(1);
		await expect(live).toHaveText("Showing 30 days for the whole consortium.");

		await page.getByRole("button", { name: "7 days" }).click();
		await expect(live).toHaveText("Showing 7 days for the whole consortium.");
	});
});
