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

	test("operates the detail toggles from the keyboard", async ({ page }) => {
		await page.goto("/serviceInfo/serviceStatus");

		const versions = page.getByRole("grid").filter({ hasText: "dcb-admin-ui" });
		const toggle = (component: string) =>
			versions
				.getByRole("row")
				.filter({ hasText: component })
				.getByRole("button", { name: /details/ });
		await expect(toggle("dcb-admin-ui")).toBeVisible();

		const header = versions.getByRole("columnheader", {
			name: "Expand all details",
		});
		await page.evaluate(() =>
			(document.activeElement as HTMLElement | null)?.blur(),
		);
		// Bounded rather than a fixed count: how many stops precede the grid is the
		// layout's business, not this test's.
		for (
			let presses = 0;
			presses < 60 &&
			!(await header.evaluate((el) => el === document.activeElement));
			presses++
		) {
			await page.keyboard.press("Tab");
		}
		await expect(header).toBeFocused();

		await page.keyboard.press("Enter");
		await expect(toggle("dcb-admin-ui")).toHaveAttribute(
			"aria-expanded",
			"true",
		);
		await expect(toggle("dcb-service")).toHaveAttribute(
			"aria-expanded",
			"true",
		);
		await page.keyboard.press(" ");
		await expect(toggle("dcb-admin-ui")).toHaveAttribute(
			"aria-expanded",
			"false",
		);
		await expect(toggle("dcb-service")).toHaveAttribute(
			"aria-expanded",
			"false",
		);

		await page.keyboard.press("ArrowDown");
		await expect(
			versions
				.getByRole("row")
				.filter({ hasText: "dcb-admin-ui" })
				.getByRole("gridcell")
				.filter({ has: page.getByRole("button", { name: /details/ }) }),
		).toBeFocused();
		// One press, one toggle: a Space that also reached the grid would open and
		// close the panel in the same keystroke.
		await page.keyboard.press(" ");
		await expect(toggle("dcb-admin-ui")).toHaveAttribute(
			"aria-expanded",
			"true",
		);
		await expect(toggle("dcb-admin-ui")).toHaveAccessibleName(
			"Collapse details",
		);
		await page.keyboard.press("Enter");
		await expect(toggle("dcb-admin-ui")).toHaveAttribute(
			"aria-expanded",
			"false",
		);
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
