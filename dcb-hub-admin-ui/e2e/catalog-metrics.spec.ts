import { expect, test } from "./fixtures/test";

import { ADMIN_ROLES, seedAuth } from "./fixtures/auth";
import { useAllFeatures } from "./fixtures/flags";
import {
	METRICS_HOST_LMS_ID,
	UNKNOWN_HOST_LMS_ID,
	mockCatalogMetrics,
} from "./fixtures/catalog-metrics-mocks";

test.describe("Catalog metrics per Host LMS", () => {
	test.beforeEach(async ({ page }) => {
		await useAllFeatures(page);
		await seedAuth(page, { roles: ADMIN_ROLES });
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
});
