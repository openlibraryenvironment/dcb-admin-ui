import { test, expect } from "./fixtures/test";
import { ADMIN_ROLES, seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import { scanForViolations } from "./fixtures/axe";
import { mockLatestReleases } from "./fixtures/service-status-mocks";
import { MOCKS } from "./fixtures/routes";

test.describe("A reference for support on a failed call", () => {
	test("names the reference the failed call was sent with", async ({
		page,
	}) => {
		await useAllFeatures(page);
		await seedAuth(page);
		await mockGraphQL(page, MOCKS);

		const sent: string[] = [];
		// Registered after mockGraphQL, so it answers first
		await page.route("**/graphql", async (route) => {
			if (route.request().postDataJSON()?.operationName !== "LoadHostLms") {
				return route.fallback();
			}
			const reference = route.request().headers()["x-request-id"];
			if (reference) sent.push(reference);
			return route.fulfill({ status: 500, body: "Internal Server Error" });
		});

		await page.goto("/hostlmss/h1h1h1h1-1111-5111-9111-111111111111");

		await expect(page.getByText("Reference for support:")).toBeVisible();
		expect(sent.length).toBeGreaterThan(0);
		expect(sent[0]).toMatch(/^adm-[0-9a-f]{12}$/);
		const shown = await page.getByText(/^adm-[0-9a-f]{12}$/).textContent();
		expect(sent).toContain(shown);
		await expect(
			page.getByRole("button", { name: "Copy the reference" }),
		).toBeVisible();
	});
});

test.describe("Alarm details", () => {
	test("reads an alarm's reason and fix as labelled lines", async ({
		page,
	}) => {
		await useAllFeatures(page);
		await seedAuth(page, { roles: ADMIN_ROLES });
		await mockGraphQL(page, {
			...MOCKS,
			LoadAlarms: {
				alarms: {
					totalSize: 1,
					content: [
						{
							id: "a1a1a1a1-0000-5000-9000-000000000001",
							code: "ILS.ALPHA.SUPPLIER_CANNOT_SUPPLY",
							created: "2026-10-21T08:00:00Z",
							lastSeen: "2026-10-21T08:30:00Z",
							repeatCount: 2,
							expires: "2026-10-28T08:00:00Z",
							alarmDetails: {
								reason:
									"At its last check Host LMS ALPHA refused DCB's credentials",
								howToFix:
									"Correct the credentials for Host LMS ALPHA in DCB Admin, then save it",
							},
						},
					],
				},
			},
		});

		await page.goto("/serviceInfo/alarms");
		await page
			.getByRole("row")
			.filter({ hasText: "SUPPLIER_CANNOT_SUPPLY" })
			.getByRole("button", { name: "Expand details" })
			.click();

		await expect(page.getByText("What happened")).toBeVisible();
		await expect(page.getByText("How to fix it")).toBeVisible();
		await expect(page.getByText(/refused DCB's credentials/)).toBeVisible();

		await scanForViolations(page);
	});
});

for (const scheme of ["light", "dark"] as const) {
	test.describe(`Scheduled work on Service Status, ${scheme}`, () => {
		test.use({ colorScheme: scheme });

		test("shows each DCB instance and the last tracking run", async ({
			page,
		}) => {
			await useAllFeatures(page);
			await seedAuth(page, { roles: ADMIN_ROLES });
			await mockLatestReleases(page);
			await page.route("**/info", (route) =>
				route.fulfill({
					json: {
						git: {
							build: { version: "9.2.0-SNAPSHOT" },
							branch: "main",
							tags: "",
							closest: {
								tag: { name: "v9.1.0", commit: { count: "12" } },
							},
						},
						env: { code: "E2E", description: "E2E environment" },
						dcbNodes: {
							"9bebc860-4d2a-4a80-98ac-01197cd2ebc6": {
								name: "sleepy_driscoll",
								scheduledTasks: "true",
								nodeStart: "Mon Oct 19 16:02:39 UTC 2026",
								lastHeartbeat: "1792583884506",
							},
						},
						trackingStatus: {
							lastRunCount: 3,
							lastRunDuration: "PT3.2098726S",
						},
						tracking: { interval: "5m" },
						harvest: { interval: "1m" },
						dcb: { "sheduled-tasks": { enabled: true } },
					},
				}),
			);

			await page.goto("/serviceInfo/serviceStatus");

			await expect(
				page.getByText("Scheduled work", { exact: true }),
			).toBeVisible();
			await expect(
				page.getByText(/last run checked 3 requests in 3.2 seconds/),
			).toBeVisible();
			await expect(
				page.getByRole("row").filter({ hasText: "sleepy_driscoll" }),
			).toContainText("Yes");

			await scanForViolations(page);
		});
	});
}
