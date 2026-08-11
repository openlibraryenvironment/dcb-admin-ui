import { expect, test } from "@playwright/test";

import { READ_ONLY_ROLES, seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import consortiumBasics from "./fixtures-data/consortium-basics.json";

const onboardingPath = "/serviceInfo/dcbNcipOnboarding";

test("conceals DCB NCIP onboarding from non-admin users", async ({ page }) => {
	await seedAuth(page, { roles: READ_ONLY_ROLES });
	await mockGraphQL(page, { LoadConsortiumHeader: consortiumBasics });

	await page.goto(onboardingPath);

	await expect(page).toHaveURL(/\/serviceInfo\/?$/);
	await expect(
		page.getByRole("link", { name: "DCB NCIP Onboarding" }),
	).toHaveCount(0);
});

test("blocks invitation entry while DCB readiness fails", async ({ page }) => {
	await seedAuth(page);
	await mockGraphQL(page, { LoadConsortiumHeader: consortiumBasics });
	await page.route("**/api/v1/dcb-profile-ncip2/readiness", (route) =>
		route.fulfill({
			json: {
				ready: false,
				profile: "DCB-NCIP2.02+",
				profileVersion: 1,
				dcbBaseUrl: "https://dcb.example",
				checks: [
					{
						code: "PEER_AUTH_ENABLED",
						status: "FAIL",
						message: "Enable dcb.peer-auth.enabled.",
						remediation: "Enable dcb.peer-auth.enabled.",
					},
				],
			},
		}),
	);

	await page.goto(onboardingPath);

	await expect(
		page.getByText(
			"This DCB node is not ready to issue an ORS Appliance invitation.",
		),
	).toBeVisible();
	await expect(page.getByText("PEER_AUTH_ENABLED")).toBeVisible();
	await expect(
		page.getByRole("button", { name: "Review invitation" }),
	).toHaveCount(0);
});

test("reviews, issues and forgets a one-time invitation", async ({ page }) => {
	await seedAuth(page);
	await mockGraphQL(page, { LoadConsortiumHeader: consortiumBasics });
	await page.route("**/api/v1/dcb-profile-ncip2/readiness", (route) =>
		route.fulfill({
			json: {
				ready: true,
				profile: "DCB-NCIP2.02+",
				profileVersion: 1,
				dcbBaseUrl: "https://dcb.example",
				checks: [
					{
						code: "PEER_AUTH_ENABLED",
						status: "PASS",
						message: "DCB peer authentication is enabled.",
					},
				],
			},
		}),
	);
	await page.route(
		"**/api/v1/dcb-profile-ncip2/membership-invitations",
		async (route) => {
			const request = route.request();
			expect(request.headers().authorization).toBe(
				"Bearer e2e-fake-access-token",
			);
			expect(request.postDataJSON()).toMatchObject({
				profile: "DCB-NCIP2.02+",
				profileVersion: 1,
				policy: {
					hostLmsCode: "TECH-DEMO-001",
					agencyCode: "TECH-DEMO-001",
					expectedSymbol: "tech-demo-001",
				},
			});
			await route.fulfill({
				status: 201,
				json: {
					invitationId: "00000000-0000-0000-0000-000000000001",
					invitation: "one-time-secret-token",
					profile: "DCB-NCIP2.02+",
					profileVersion: 1,
					expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
					dcbNodeId: "DCB:TEST",
					dcbNodeName: "Test DCB",
					policy: {},
				},
			});
		},
	);

	await page.goto(onboardingPath);
	await page.getByLabel("Host LMS code").fill("TECH-DEMO-001");
	await page.getByLabel("Agency code").fill("TECH-DEMO-001");
	await page.getByLabel("Expected ORS symbol").fill("tech-demo-001");
	await page.getByRole("button", { name: "Review invitation" }).click();
	await expect(
		page.getByText(/authorizes one matching ORS Appliance/),
	).toBeVisible();
	await page.getByRole("button", { name: "Issue invitation" }).click();

	await expect(page.getByLabel("DCB base URL")).toHaveValue(
		"https://dcb.example",
	);
	await expect(page.getByLabel("Invitation token")).toHaveValue(
		"one-time-secret-token",
	);
	await expect(
		page.getByText(/Invitation created\. It expires in/),
	).toBeVisible();

	await page.goto("/serviceInfo");
	await page.goto(onboardingPath);
	await expect(page.getByLabel("Invitation token")).toHaveCount(0);
});
