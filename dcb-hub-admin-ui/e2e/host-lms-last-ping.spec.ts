import type { Page } from "@playwright/test";

import { test, expect } from "./fixtures/test";
import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures, useAllFeaturesExcept } from "./fixtures/flags";
import { MOCKS } from "./fixtures/routes";

// The fixture's Host LMS was last checked with its credentials refused
const DETAIL = "/hostlmss/h1h1h1h1-1111-5111-9111-111111111111";

/** The text of every LoadHostLms document the page sends. */
function captureHostLmsQueries(page: Page): string[] {
	const queries: string[] = [];
	page.on("request", (request) => {
		if (!request.url().endsWith("/graphql")) return;
		const body = request.postDataJSON();
		if (body?.operationName === "LoadHostLms") queries.push(body.query);
	});
	return queries;
}

test.describe("Host LMS last connection check", () => {
	test.beforeEach(async ({ page }) => {
		await seedAuth(page);
	});

	test("says on the Host LMS page that its credentials were refused", async ({
		page,
	}) => {
		await useAllFeatures(page);
		await mockGraphQL(page, MOCKS);
		await page.goto(DETAIL);

		await expect(page.getByText("Last connection check")).toBeVisible();
		await expect(page.getByText("Refused DCB's credentials")).toBeVisible();
		await expect(
			page.getByText(/rejected DCB's API key or login/),
		).toBeVisible();
		await expect(page.getByText("Last worked")).toBeVisible();
		await expect(page.getByText("Sierra 6.2")).toBeVisible();
	});

	test("shows each Host LMS's last check in the list", async ({ page }) => {
		await useAllFeatures(page);
		await mockGraphQL(page, MOCKS);
		await page.goto("/hostlmss");

		await expect(
			page.getByRole("columnheader", { name: "Last check" }),
		).toBeVisible();
		await expect(
			page.getByRole("gridcell", { name: "Refused DCB's credentials" }),
		).toBeVisible();
	});

	test("neither asks for the last check nor shows it with the flag off", async ({
		page,
	}) => {
		await useAllFeaturesExcept(page, ["VITE_FEATURE_HOST_LMS_PROBES"]);
		await mockGraphQL(page, MOCKS);
		const queries = captureHostLmsQueries(page);

		await page.goto(DETAIL);
		await expect(page.getByText("alpha-lms").first()).toBeVisible();

		await expect(page.getByText("Last connection check")).toHaveCount(0);
		expect(queries.length).toBeGreaterThan(0);
		for (const query of queries) expect(query).not.toContain("lastPing");
	});
});
