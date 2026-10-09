import { test, expect } from "@playwright/test";

import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import { MOCKS, ROUTES } from "./fixtures/routes";

/**
 * No route renders the crash screen with its own data mocked.
 *
 * The axe and missing-translation gates both walk ROUTES and both passed on four pages
 * that were a 500 for every visit, because an axe scan of GlobalError is a clean scan
 * and its strings are all translated. A crashed route is a green gate.
 */

const CRASH_HEADING = "500 Server error";

for (const route of ROUTES) {
	test(`${route.path} renders its own page, not the crash screen`, async ({
		page,
	}) => {
		const crashes: string[] = [];
		page.on("console", (message) => {
			if (message.text().includes("Global crash caught by TanStack"))
				crashes.push(message.text().slice(0, 300));
		});

		await seedAuth(page);
		await useAllFeatures(page);
		await mockGraphQL(page, MOCKS);
		await route.setup?.(page);
		await page.goto(route.path);

		// `ready` is the route's own "my data has arrived" marker, so it fails on a
		// crashed page before the assertions below are reached. Asserted anyway: the
		// marker could in principle appear on a page that then throws.
		await route.ready(page);

		await expect(page.getByText(CRASH_HEADING)).toHaveCount(0);
		expect(crashes, `GlobalError was reached: ${crashes[0] ?? ""}`).toEqual([]);

		// Exactly one h1, and a document title that names the page. Neither is an axe
		// rule: axe checks heading ORDER, not that a page has a top-level heading at
		// all, and it has nothing to say about <title>. A sweep of all 54 routes found
		// /profile heading its content with an h2, /serviceInfo/requestErrors/requests
		// with neither when its `description` search param is absent, and
		// /unauthorised passing PageContainer no title.
		await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
		await expect(page).not.toHaveTitle("DCB Admin");
	});
}
