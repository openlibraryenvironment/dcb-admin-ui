import { expect, test, type Page } from "@playwright/test";

import { ADMIN_ROLES, seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import {
	legacyConsortiumMocks,
	LEGACY_CONSORTIUM,
	useLegacyService,
	V9_ONLY_FIELDS,
} from "./fixtures/legacy-service-mocks";

/**
 * DCB Admin against dcb-service 8.71.0 — R-19.
 *
 * <h2>What went wrong, and why these are e2e rather than unit tests</h2>
 *
 * The brand columns V9_0_004 introduced were selected unconditionally in the two
 * consortium documents. A GraphQL field the server has never heard of is not a null -
 * it is a validation error that fails the whole operation - so on 8.71.0 the setup
 * wizard, the consortium section and the header on every page went down together, and
 * saving the consortium profile failed for reasons that had nothing to do with brand.
 *
 * The unit gate (src/graphql/schemaConformance.test.ts) proves the DOCUMENTS are valid.
 * These prove the APPLICATION is: that the routes render rather than showing an error
 * component, that the header still shows the marks 8.71.0 holds under the old names,
 * that a save succeeds, and that nothing gated is reachable.
 */

/** Every GraphQL request this page made, captured for assertion. */
async function captureGraphQL(page: Page): Promise<string[]> {
	const bodies: string[] = [];
	page.on("request", (request) => {
		if (request.url().includes("/graphql") && request.method() === "POST") {
			bodies.push(request.postData() ?? "");
		}
	});
	return bodies;
}

/** A GraphQL document with its `#` comment lines removed. */
const stripComments = (document: string): string =>
	document
		.split("\n")
		.filter((line) => !line.trim().startsWith("#"))
		.join("\n");

test.describe("dcb-service 8.71.0", () => {
	test.beforeEach(async ({ page }) => {
		await useLegacyService(page);
		await seedAuth(page, { roles: ADMIN_ROLES });
	});

	test("the header shows the consortium and its mark from the pre-migration columns", async ({
		page,
	}) => {
		// Not merely "does not crash". Deploying this release against 8.71.0 must not
		// visibly REMOVE branding the deployment already shows, which is why legacy mode
		// reads headerImageUrl/aboutImageUrl rather than selecting nothing.
		const requests = await captureGraphQL(page);
		await mockGraphQL(page, legacyConsortiumMocks);

		await page.goto("/consortium");

		await expect(
			page.getByText(LEGACY_CONSORTIUM.displayName).first(),
		).toBeVisible();

		const header = requests.find((body) =>
			body.includes("LoadConsortiumHeader"),
		);
		expect(header, "the header query was never sent").toBeDefined();
		expect(header).toContain("headerImageUrl");
		for (const field of V9_ONLY_FIELDS) {
			expect(header, `asked 8.71.0 for ${field}`).not.toContain(field);
		}
	});

	test("never asks 8.71.0 for the uploader fields", async ({ page }) => {
		// They are a member of staff's name and email address on a type any
		// authenticated principal can read, which is why 9.0.0 deleted them. Falling
		// back to the old columns must not drag the PII back with them.
		const requests = await captureGraphQL(page);
		await mockGraphQL(page, legacyConsortiumMocks);

		await page.goto("/consortium");
		await expect(
			page.getByText(LEGACY_CONSORTIUM.displayName).first(),
		).toBeVisible();

		for (const body of requests) {
			// The SELECTION, with the prose stripped. The document explains in a comment
			// why the uploader pair is not asked for, and matching the raw body would
			// fail on the very comment that records the decision.
			const selection = stripComments(
				(JSON.parse(body) as { query: string }).query,
			);

			for (const field of [
				"headerImageUploader",
				"headerImageUploaderEmail",
				"aboutImageUploader",
				"aboutImageUploaderEmail",
			]) {
				expect(selection, `asked 8.71.0 for ${field}`).not.toContain(field);
			}
		}
	});

	test("the consortium page renders its content, not an error component", async ({
		page,
	}) => {
		await mockGraphQL(page, legacyConsortiumMocks);

		await page.goto("/consortium");

		await expect(
			page.getByRole("heading", { name: /unable to load|error/i }),
		).toHaveCount(0);
		await expect(page.getByText(LEGACY_CONSORTIUM.description)).toBeVisible();
	});

	test("first-run setup opens instead of throwing from its loader", async ({
		page,
	}) => {
		// /setup fetches LoadConsortium with ensureQueryData, so a failing document
		// there is a route that renders its errorComponent - the wizard is simply gone.
		await mockGraphQL(page, {
			...legacyConsortiumMocks,
			LoadLibraries: { libraries: { totalSize: 2, content: [] } },
		});

		await page.goto("/setup");

		await expect(
			page.getByRole("heading", { name: /unable to load/i }),
		).toHaveCount(0);
		// The rail is the flow; if the loader threw there is no rail.
		await expect(page.getByRole("navigation").first()).toBeVisible();
	});

	test("the setup rail does not offer the discovery chapter", async ({
		page,
	}) => {
		await mockGraphQL(page, {
			...legacyConsortiumMocks,
			LoadLibraries: { libraries: { totalSize: 2, content: [] } },
		});

		await page.goto("/setup/discovery");

		// isConsortiumSetupStepId no longer recognises it, so the route redirects to
		// the start of the flow rather than rendering a chapter that cannot save.
		await expect(page).not.toHaveURL(/\/setup\/discovery$/);
	});

	test("the branding tab is absent, and its URL redirects", async ({
		page,
	}) => {
		await mockGraphQL(page, legacyConsortiumMocks);

		await page.goto("/consortium");
		await expect(page.getByRole("tab", { name: /branding/i })).toHaveCount(0);

		// Hiding the tab is UX. The route guard is what stops a typed or bookmarked URL.
		await page.goto("/consortium/branding");
		await expect(page).toHaveURL(/\/consortium$/);
	});

	test("DCB NCIP onboarding is absent, and its URL redirects", async ({
		page,
	}) => {
		await mockGraphQL(page, legacyConsortiumMocks);

		await page.goto("/serviceInfo");
		await expect(
			page.getByRole("link", { name: /ncip onboarding/i }),
		).toHaveCount(0);

		await page.goto("/serviceInfo/dcbNcipOnboarding");
		await expect(page).toHaveURL(/\/serviceInfo$/);
	});

	test("Service Info says which features this dcb-service cannot serve", async ({
		page,
	}) => {
		// The operator-facing half of the change: how somebody finds out the upgrade
		// switch is due, and how a support engineer explains a missing tab.
		await mockGraphQL(page, legacyConsortiumMocks);

		await page.goto("/serviceInfo");

		const table = page.getByRole("table", { name: /feature availability/i });
		await expect(table).toBeVisible();
		// The version this deployment reports, so the row below can be acted on.
		await expect(page.getByText(/reports version 8\.71\.0/i)).toBeVisible();
		await expect(
			table.getByRole("row", { name: /consortium branding/i }),
		).toContainText(/not available/i);
	});
});
