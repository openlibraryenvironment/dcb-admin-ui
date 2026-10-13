import { test, expect } from "./fixtures/test";

import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import { MOCKS } from "./fixtures/routes";

/**
 * A rejected search keeps the query that caused it on screen - W-9.
 *
 * The shared index answers a malformed query with a 4xx. Under the client's default
 * `throwOnError` that reached `GlobalError`, which replaced the page - taking away the
 * SearchQueryBuilder and the text the reader has to edit to recover, and offering a
 * reload that fails the same way. docs/query-error-policy.md, "A failure the user
 * caused".
 */

test("a rejected search is reported around the builder, not instead of it", async ({
	page,
}) => {
	await useAllFeatures(page);
	await mockGraphQL(page, MOCKS);
	await seedAuth(page);

	// What the search service does with syntax it cannot parse.
	await page.route("**/search/instances*", (route) =>
		route.fulfill({
			status: 400,
			json: { message: "Failed to parse query" },
		}),
	);

	await page.goto("/search?q=title%3A%28unclosed");

	// The inline failure, which is the whole point of the policy exception.
	await expect(page.getByText("The search was not successful")).toBeVisible();

	// And NOT the crash boundary.
	await expect(page.getByText("500 Server error")).toHaveCount(0);

	// The page itself is still here: its heading, and the control that produced the
	// query. A reader who cannot reach the builder cannot fix the query.
	await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
	await expect(
		page.getByRole("button", { name: /search/i }).first(),
	).toBeVisible();
});
