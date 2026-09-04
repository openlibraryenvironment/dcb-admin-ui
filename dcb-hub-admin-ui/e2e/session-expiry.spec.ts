import { test, expect } from "@playwright/test";
import { seedAuth, getAuthStorageKey } from "./fixtures/auth";
import { E2E_KEYCLOAK_URL } from "./fixtures/keycloak";

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

		// The precondition this test actually needs, made explicit.
		//
		// A 401 does not end the session on its own: application.tsx spends one
		// silent renewal first and only tears down if that fails. The fixture seeds
		// refresh_token: undefined, so signinSilent() cannot do a plain token
		// request - it starts a fresh authorisation, which begins by fetching
		// .well-known/openid-configuration from the authority.
		//
		// That host is deliberately unresolvable, so WITHOUT this route the renewal
		// fails only as fast as the machine's resolver reports NXDOMAIN. Measured:
		// the redirect lands at ~1.9s normally, ~2.5s with three other workers
		// competing, and at 5.5s with 4s of latency injected on that one request -
		// past the 5s default this assertion used to run on. The real ceiling is
		// oidc-client-ts's silentRequestTimeoutInSeconds, which is 10s.
		//
		// Aborting does not make the test faster; the ~2s is the app booting. It
		// removes the unbounded network variance, which is what made this flake.
		await page.route(`${new URL(E2E_KEYCLOAK_URL).origin}/**`, (route) =>
			route.abort(),
		);

		await page.goto("/libraries");

		// Not the 5s default. This waits on a redirect that happens after the app
		// boots, fires its first query and handles a 401 - 5s was a default, not a
		// budget anybody chose.
		await expect(page).toHaveURL(/\/logout\?reason=session_expired/, {
			timeout: 15_000,
		});
		const remaining = await page.evaluate(
			(key) => window.localStorage.getItem(key),
			storageKey,
		);
		expect(remaining).toBeNull();
	});
});
