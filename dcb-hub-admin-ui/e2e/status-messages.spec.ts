import { test, expect } from "@playwright/test";

import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import { MOCKS } from "./fixtures/routes";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import mappings from "./fixtures-data/mappings.json";
import hostLms from "./fixtures-data/host-lms.json";

/**
 * What a reader who cannot see the screen is told when something changes.
 *
 * WCAG 4.1.3 Status Messages, which no axe rule reaches: a missing live region is
 * indistinguishable from a page that has nothing to announce.
 */

test("a grid announces how many results it found", async ({ page }) => {
	await seedAuth(page);
	await useAllFeatures(page);
	await mockGraphQL(page, MOCKS);
	await page.goto("/libraries");

	// MUI X ships no aria-live of its own, so without ours a filter that cut 400 rows
	// to 3 was announced as nothing at all.
	await expect(
		page.locator('[aria-live="polite"]').filter({ hasText: /\d+ results?$/ }),
	).toHaveCount(1);
});

test("the crash page offers a retry that recovers the route", async ({
	page,
}) => {
	await seedAuth(page);
	await useAllFeatures(page);

	// Not mockGraphQL: this needs ONE operation to fail and then succeed, and that
	// fixture serves a fixed body per operation. `retry: 1` on the query client means
	// two attempts per mount, so both are refused before the boundary is reached.
	let attempts = 0;
	await page.route("**/graphql", async (route) => {
		const body = route.request().postDataJSON() as {
			operationName?: string;
		} | null;
		const operationName = body?.operationName;

		if (operationName === "LoadMappings") {
			attempts += 1;
			if (attempts <= 2) {
				await route.fulfill({ status: 500, json: { message: "nope" } });
				return;
			}
			await route.fulfill({ json: { data: mappings } });
			return;
		}
		if (operationName === "LoadConsortiumHeader") {
			await route.fulfill({ json: { data: consortiumBasics } });
			return;
		}
		if (operationName === "LoadHostLmsCodes") {
			await route.fulfill({ json: { data: hostLms } });
			return;
		}
		await route.fulfill({ json: { data: {} } });
	});

	await page.goto("/mappings/allReferenceValue");

	const crash = page.getByRole("alert");
	await expect(crash).toContainText("500 Server error");
	// The old page offered "Go back" to the home page and nothing else, so a transient
	// failure cost the user their place.
	await expect(crash.getByRole("button", { name: "Go back" })).toBeVisible();

	await crash.getByRole("button", { name: "Try again" }).click();

	await expect(page.getByText("loanable-item")).toBeVisible();
	await expect(page.getByText("500 Server error")).toHaveCount(0);
});
