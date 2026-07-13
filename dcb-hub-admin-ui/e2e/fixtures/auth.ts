import type { Page } from "@playwright/test";

// Mirrors the values baked into the e2e build via .env.e2e / playwright.config.ts's
// webServer.env - must match exactly, since they form the localStorage key below.
const KEYCLOAK_URL =
	process.env.VITE_KEYCLOAK_URL ||
	"https://e2e-fake-keycloak.invalid/realms/dcb";
const KEYCLOAK_ID = process.env.VITE_KEYCLOAK_ID || "dcb-admin-e2e";

export const ADMIN_ROLES = ["ADMIN", "CONSORTIUM_ADMIN"];
export const READ_ONLY_ROLES = ["LIBRARY_READ_ONLY"];

interface FakeUserOptions {
	roles?: string[];
}

// Shape matches oidc-client-ts's User.toStorageString() exactly (see
// node_modules/oidc-client-ts/dist/esm/oidc-client-ts.js) - the app never
// validates this against a real Keycloak token, it just deserializes
// whatever WebStorageStateStore (backed by localStorage) hands it back.
function buildFakeUser({ roles = ADMIN_ROLES }: FakeUserOptions = {}) {
	return {
		id_token: "e2e-fake-id-token",
		session_state: "e2e-fake-session-state",
		access_token: "e2e-fake-access-token",
		refresh_token: undefined,
		token_type: "Bearer",
		scope: "openid profile email",
		profile: {
			sub: "e2e-test-user",
			email: "e2e-test-user@example.invalid",
			preferred_username: "e2e-test-user",
			roles,
		},
		// Far enough in the future that oidc-client-ts's automaticSilentRenew
		// timer (scheduled relative to expires_at) never fires during a test run.
		expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365,
	};
}

// Exposed so tests can assert on the localStorage key without needing to
// evaluate() on an unnavigated page (about:blank throws SecurityError on
// localStorage access).
export function getAuthStorageKey() {
	return `oidc.user:${KEYCLOAK_URL}:${KEYCLOAK_ID}`;
}

// Call in a test.beforeEach (before page.goto) to start the test already
// authenticated. Omit entirely to exercise the unauthenticated/login-redirect path.
export async function seedAuth(page: Page, options?: FakeUserOptions) {
	const key = getAuthStorageKey();
	const value = JSON.stringify(buildFakeUser(options));

	// Must run before any app script executes, so react-oidc-context's
	// initial getUser() call already finds a session on first render.
	await page.addInitScript(
		([storageKey, storageValue]) => {
			window.localStorage.setItem(storageKey, storageValue);
		},
		[key, value] as const,
	);
}
