import { expect, test } from "@playwright/test";

import pkg from "../package.json";
import { ADMIN_ROLES, seedAuth } from "./fixtures/auth";
import { useAllFeatures } from "./fixtures/flags";
import {
	LATEST_RELEASES_URL,
	mockLatestReleases,
} from "./fixtures/service-status-mocks";

test.describe("Service Status versions", () => {
	test.beforeEach(async ({ page }) => {
		await useAllFeatures(page);
		await seedAuth(page, { roles: ADMIN_ROLES });
		await page.route("**/info", (route) =>
			route.fulfill({
				json: {
					git: {
						build: { version: "9.1.0-SNAPSHOT" },
						branch: "main",
						tags: "",
						closest: { tag: { name: "v9.0.0", commit: { count: "43" } } },
					},
					env: { code: "E2E", description: "E2E environment" },
				},
			}),
		);
		await mockLatestReleases(page);
	});

	test("compares each running build with its latest release", async ({
		page,
	}) => {
		const githubRequests: string[] = [];
		page.on("request", (request) => {
			if (request.url().startsWith("https://api.github.com/")) {
				githubRequests.push(request.url());
			}
		});

		await page.goto("/serviceInfo/serviceStatus");

		const admin = page.getByRole("row").filter({ hasText: "dcb-admin-ui" });
		await expect(admin).toContainText(pkg.version);
		await expect(admin).toContainText("Up to date");

		const service = page.getByRole("row").filter({ hasText: "dcb-service" });
		await expect(service).toContainText("9.1.0-SNAPSHOT");
		await expect(service).toContainText("v9.0.0");
		await expect(service).toContainText("Ahead of the latest release");

		for (const url of githubRequests) {
			expect(url).toMatch(/\/releases\/latest$/);
		}
	});

	test("still shows the running builds when GitHub refuses", async ({
		page,
	}) => {
		await page.route(LATEST_RELEASES_URL, (route) =>
			route.fulfill({
				status: 403,
				headers: { "access-control-allow-origin": "*" },
				json: { message: "API rate limit exceeded" },
			}),
		);

		await page.goto("/serviceInfo/serviceStatus");

		const admin = page.getByRole("row").filter({ hasText: "dcb-admin-ui" });
		await expect(admin).toContainText(pkg.version);
		await expect(admin).toContainText("Cannot check");

		const service = page.getByRole("row").filter({ hasText: "dcb-service" });
		await expect(service).toContainText("9.1.0-SNAPSHOT");
		await expect(service).toContainText("Cannot check");
	});
});
