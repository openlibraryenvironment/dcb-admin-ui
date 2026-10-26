import { expect, test } from "./fixtures/test";

import { ADMIN_ROLES, seedAuth } from "./fixtures/auth";
import { useAllFeatures, useAllFeaturesExcept } from "./fixtures/flags";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import {
	METRICS_HOST_LMS_ID,
	UNKNOWN_HOST_LMS_ID,
	mockCatalogMetrics,
	scopeLibraries,
} from "./fixtures/catalog-metrics-mocks";
import consortiumBasics from "./fixtures-data/consortium-basics.json";

test.describe("Catalog metrics per Host LMS", () => {
	test.beforeEach(async ({ page }) => {
		await useAllFeatures(page);
		await seedAuth(page, { roles: ADMIN_ROLES });
		await mockGraphQL(page, {
			LoadConsortiumHeader: consortiumBasics,
			LoadLibraries: scopeLibraries,
		});
	});

	test("counts only a chosen group, and keeps the choice on reload", async ({
		page,
	}) => {
		const scopedRequests: string[] = [];
		await mockCatalogMetrics(page, () => 1200, scopedRequests);

		await page.goto("/serviceInfo/catalogMetricsByHostLms");
		await page.getByRole("combobox", { name: "Libraries" }).click();
		await page.getByRole("option", { name: "North" }).click();

		// The grid's view notice is a second status on this page
		await expect(
			page
				.getByRole("status")
				.filter({ hasText: "for the selected libraries only" }),
		).toBeVisible();
		await expect.poll(() => scopedRequests.at(-1)).toBe("alpha-lms,beta-lms");
		await expect(page).toHaveURL(/scope=/);

		const before = scopedRequests.length;
		await page.reload();

		await expect.poll(() => scopedRequests.length).toBeGreaterThan(before);
		expect(scopedRequests.at(-1)).toBe("alpha-lms,beta-lms");
		await expect(page.getByRole("button", { name: "North" })).toBeVisible();
	});

	test("opens one Host LMS from the shared list", async ({ page }) => {
		await mockCatalogMetrics(page);

		await page.goto("/serviceInfo/catalogMetricsByHostLms");
		await expect(page.getByText(/Counted at 2026-09-29/)).toBeVisible();
		await page.getByRole("gridcell", { name: "Alpha Sierra" }).click();

		await expect(page).toHaveURL(
			new RegExp(
				`/serviceInfo/catalogMetricsByHostLms/${METRICS_HOST_LMS_ID}$`,
			),
		);
		await expect(
			page.getByRole("heading", {
				level: 1,
				name: "Catalogue metrics: Alpha Sierra",
			}),
		).toBeVisible();
		await expect(page.getByRole("status")).toContainText(
			"1,200 records are waiting to be ingested.",
		);
		await expect(page.getByRole("status")).toContainText(
			"10 records failed to ingest.",
		);
		await expect(page.getByText('"offset": 2000')).toBeVisible();
		await expect(
			page.getByRole("link", { name: "Open the Host LMS record" }),
		).toHaveAttribute("href", new RegExp(`/hostlmss/${METRICS_HOST_LMS_ID}$`));
	});

	test("recounts on Refresh and announces the new state", async ({ page }) => {
		let awaiting = 1200;
		await mockCatalogMetrics(page, () => awaiting);

		await page.goto(
			`/serviceInfo/catalogMetricsByHostLms/${METRICS_HOST_LMS_ID}`,
		);
		await expect(page.getByRole("status")).toContainText(
			"1,200 records are waiting to be ingested.",
		);

		awaiting = 0;
		await page.getByRole("button", { name: "Refresh counts" }).click();

		await expect(page.getByRole("status")).toContainText(
			"No records are waiting to be ingested.",
		);
	});

	test("says so when there is no such Host LMS", async ({ page }) => {
		await mockCatalogMetrics(page);

		await page.goto(
			`/serviceInfo/catalogMetricsByHostLms/${UNKNOWN_HOST_LMS_ID}`,
		);

		await expect(page.getByText("Unable to find the record")).toBeVisible();
	});

	test("a reader's aggregate is in the link, and totals every row", async ({
		page,
	}) => {
		await mockCatalogMetrics(page);
		await page.goto("/serviceInfo/catalogMetricsByHostLms");
		await expect(page.getByText(/Counted at 2026-09-29/)).toBeVisible();

		const header = page
			.getByRole("columnheader")
			.filter({ hasText: "Harvested" });
		await header.hover();
		await header.getByRole("button", { name: "Harvested column menu" }).click();
		await page
			.getByRole("menu")
			.getByRole("combobox", { name: "Aggregation" })
			.click();
		await page.getByRole("option", { name: "Average" }).click();

		await expect(page).toHaveURL(/\?agg=sourceRecordCount:avg$/);
		// Alpha 6,200 and Beta 0: the average is in no row
		await expect(page.getByRole("gridcell", { name: "3,100" })).toBeVisible();

		await page.reload();
		await expect(page.getByRole("gridcell", { name: "3,100" })).toBeVisible();
	});
});

// A dcb-service before the hostLmsCodes parameter ignores it and counts every Host LMS
test.describe("Catalog metrics on an older dcb-service", () => {
	test("offers no choice of libraries and asks only for the shared count", async ({
		page,
	}) => {
		await useAllFeaturesExcept(page, ["VITE_FEATURE_HOST_LMS_PROBES"]);
		await seedAuth(page, { roles: ADMIN_ROLES });
		await mockGraphQL(page, {
			LoadConsortiumHeader: consortiumBasics,
			LoadLibraries: scopeLibraries,
		});
		const scopedRequests: string[] = [];
		await mockCatalogMetrics(page, () => 1200, scopedRequests);

		await page.goto("/serviceInfo/catalogMetricsByHostLms");

		// The grid's view notice is a second status on this page
		await expect(
			page
				.getByRole("status")
				.filter({ hasText: "Counts for every Host LMS are shared" }),
		).toBeVisible();
		await expect(page.getByRole("combobox", { name: "Libraries" })).toHaveCount(
			0,
		);
		expect(scopedRequests).toEqual([]);
	});
});
