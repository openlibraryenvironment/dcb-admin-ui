/**
 * The Keycloak identity the e2e build is compiled with, and the one the auth fixture
 * seeds localStorage under.
 *
 * ONE definition, because the two must agree to the character. oidc-client-ts keys its
 * WebStorageStateStore on `oidc.user:${authority}:${client_id}`, so a build whose
 * authority differs from the fixture's simply never finds a signed-in user: every
 * authenticated spec lands on the sign-in page and fails on an element that was never
 * going to render.
 *
 * The fallbacks below are what CI uses, and that is the point. `.env.e2e` is git-ignored,
 * so it exists on a developer's machine and nowhere else - which is exactly why these
 * values cannot come from it alone. They are not secrets and they reach no real server:
 * `.invalid` is reserved by RFC 2606 and can never resolve.
 */
export const E2E_KEYCLOAK_URL =
	process.env.VITE_KEYCLOAK_URL ||
	"https://e2e-fake-keycloak.invalid/realms/dcb";

export const E2E_KEYCLOAK_ID = process.env.VITE_KEYCLOAK_ID || "dcb-admin-e2e";
