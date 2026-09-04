import type { Page } from "@playwright/test";

import { E2E_KEYCLOAK_ID, E2E_KEYCLOAK_URL } from "./keycloak";

// The same constants playwright.config.ts bakes into the build. Imported rather than
// re-derived: they form the localStorage key below and must match to the character.
const KEYCLOAK_URL = E2E_KEYCLOAK_URL;
const KEYCLOAK_ID = E2E_KEYCLOAK_ID;

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

// A sentinel recording that the initial seed already ran. Deliberately NOT
// namespaced and NOT the OIDC key itself, so it survives both clearAppStorage()
// (which only drops this app's namespaced keys) and userManager.removeUser()
// (which drops only the OIDC user key). That is what lets the seed be a ONE-TIME
// event rather than a resurrection on every reload - see seedAuth.
const SEED_SENTINEL_KEY = "__e2e_auth_seeded__";

// Call in a test.beforeEach (before page.goto) to start the test already
// authenticated. Omit entirely to exercise the unauthenticated/login-redirect path.
export async function seedAuth(page: Page, options?: FakeUserOptions) {
	const key = getAuthStorageKey();
	const value = JSON.stringify(buildFakeUser(options));

	// Must run before any app script executes, so react-oidc-context's initial
	// getUser() call already finds a session on first render. addInitScript re-runs
	// on EVERY document load, including a hard-reload logout path
	// (endSession -> window.location.assign('/logout')); a blind setItem there would
	// re-seed the session the app just tore down and mask real logout bugs. The
	// sentinel makes this a one-time seed: on the first load it plants the user; on
	// any reload it does nothing, so a session the app deliberately ended stays
	// ended (and a session that is simply still live persists in localStorage on its
	// own, needing no re-seed).
	await page.addInitScript(
		([storageKey, storageValue, sentinelKey]) => {
			if (window.localStorage.getItem(sentinelKey)) return;
			window.localStorage.setItem(storageKey, storageValue);
			window.localStorage.setItem(sentinelKey, "1");
		},
		[key, value, SEED_SENTINEL_KEY] as const,
	);
}
