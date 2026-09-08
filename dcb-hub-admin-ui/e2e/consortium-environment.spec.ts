import { expect, test } from "@playwright/test";

import { ADMIN_ROLES, seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import consortium from "./fixtures-data/consortium.json";

/**
 * The Environment tab.
 *
 * Service versions, tracking configuration and RAG status used to sit at the foot of the
 * onboarding page, below the grid of libraries needing attention — two different
 * questions stacked, so the second was only found by somebody scrolling past the first.
 * They are a tab of their own now.
 *
 * <h2>What this catches that nothing else does</h2>
 *
 * `ConsortiumTabs` names its tabs by translation key, and a key that does not exist is not
 * an error in i18next — it renders the key itself. The tab shipped reading
 * "nav.consortium.environment" because only `consortium.environment` had been added, and
 * neither the type-checker, the linter nor any unit test can see that: the string is
 * correct TypeScript, the component is correct React, and the page renders.
 *
 * Asserting the tab by its ACCESSIBLE NAME is what makes it visible, which is the general
 * argument for role-based queries over test ids.
 */
const MOCKS = {
	LoadConsortiumHeader: consortiumBasics,
	LoadConsortium: consortium,
};

test.describe("the consortium's environment tab", () => {
	test.beforeEach(async ({ page }) => {
		await useAllFeatures(page);
		await seedAuth(page, { roles: ADMIN_ROLES });
		await mockGraphQL(page, MOCKS);
	});

	test("is offered by name from the consortium tab bar, and goes there", async ({
		page,
	}) => {
		await page.goto("/consortium");

		// Scoped to the named tablist: this application renders four tab bars, and an
		// unscoped getByRole("tab") says nothing about which one answered.
		const tab = page
			.getByRole("tablist", { name: "Consortium" })
			.getByRole("tab", { name: "Environment" });

		await expect(tab).toBeVisible();

		await tab.click();

		await expect(page).toHaveURL(/\/consortium\/environment$/);
		await expect(page.getByRole("heading", { level: 1 })).toHaveText(
			"Environment",
		);
	});

	test("has its own page, headed as itself rather than as onboarding", async ({
		page,
	}) => {
		await page.goto("/consortium/environment");

		// The h1 comes from PageContainer's `title`, which is also the browser tab and the
		// breadcrumb. It said "Onboarding" on this page, copied from the route it split
		// out of.
		await expect(page.getByRole("heading", { level: 1 })).toHaveText(
			"Environment",
		);
		// The h2 comes from CombinedEnvironmentComponent, which owns its own heading.
		// The route adds none: one here made two headings saying the same thing, and
		// /serviceInfo/serviceStatus renders the same component with no extra heading.
		await expect(
			page.getByRole("heading", { level: 2, name: "Your DCB environment" }),
		).toBeVisible();
	});

	test("marks itself as the current tab once you are on it", async ({
		page,
	}) => {
		await page.goto("/consortium/environment");

		await expect(
			page.getByRole("tab", { name: "Environment", selected: true }),
		).toBeVisible();
	});
});
