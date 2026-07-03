import { test, expect } from "@playwright/test";
import { seedAuth, getAuthStorageKey } from "./fixtures/auth";

// Regression test for the Phase B1 fix in src/main.tsx: the 401 handler
// must clear the OIDC user from the SAME storage react-oidc-context reads
// it from (localStorage, via WebStorageStateStore) - a prior mismatch left
// it reading from sessionStorage instead, so the stale session was never
// actually cleared.
//
// Note: the real 15-minute idle-timeout path (src/routes/__authenticated.tsx)
// isn't practically testable in CI without mocking react-idle-timer's
// internals - this covers the other route into the same "session ended"
// state, a 401 from the API.

test.describe("Session expiry handling", () => {
	test("a 401 GraphQL response redirects to /logout and clears the stored OIDC user", async ({
		page,
	}) => {
		await seedAuth(page);
		const storageKey = getAuthStorageKey();

		await page.route("**/graphql", async (route) => {
			await route.fulfill({
				status: 401,
				json: { errors: [{ message: "Unauthorized" }] },
			});
		});

		await page.goto("/libraries");

		await expect(page).toHaveURL(/\/logout\?reason=session_expired/);
		const remaining = await page.evaluate(
			(key) => window.localStorage.getItem(key),
			storageKey,
		);
		expect(remaining).toBeNull();
	});
});
