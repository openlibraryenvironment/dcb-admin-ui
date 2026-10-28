import type { Page } from "@playwright/test";

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

const CORS = {
	"access-control-allow-origin": "*",
	"access-control-allow-headers": "authorization, content-type",
};

const jwtPart = (value: object) =>
	Buffer.from(JSON.stringify(value)).toString("base64url");

/**
 * A Keycloak that signs in whoever asks, for a test that needs the real sign-in round trip:
 * discovery, the authorisation redirect back to the app with a code, the token exchange and
 * userinfo. oidc-client-ts checks the ID token's subject and nonce but not its signature.
 */
export async function fakeKeycloakSignIn(page: Page, roles: string[]) {
	const endpoint = (path: string) =>
		`${E2E_KEYCLOAK_URL}/protocol/openid-connect/${path}`;
	const claims = {
		sub: "e2e-test-user",
		preferred_username: "e2e-test-user",
		roles,
	};
	let nonce: string | null = null;

	await page.route(
		`${E2E_KEYCLOAK_URL}/.well-known/openid-configuration`,
		(route) =>
			route.fulfill({
				headers: CORS,
				json: {
					issuer: E2E_KEYCLOAK_URL,
					authorization_endpoint: endpoint("auth"),
					token_endpoint: endpoint("token"),
					userinfo_endpoint: endpoint("userinfo"),
					end_session_endpoint: endpoint("logout"),
					jwks_uri: endpoint("certs"),
				},
			}),
	);
	await page.route(
		(url) => url.href.startsWith(`${endpoint("auth")}?`),
		(route) => {
			const asked = new URL(route.request().url());
			nonce = asked.searchParams.get("nonce");
			const back = new URL(asked.searchParams.get("redirect_uri") ?? "");
			back.searchParams.set("code", "e2e-code");
			back.searchParams.set("state", asked.searchParams.get("state") ?? "");
			return route.fulfill({
				status: 302,
				headers: { location: back.toString() },
			});
		},
	);
	await page.route(endpoint("token"), (route) =>
		route.fulfill({
			headers: CORS,
			json: {
				access_token: "e2e-fake-access-token",
				token_type: "Bearer",
				expires_in: 3600,
				scope: "openid profile email",
				id_token: [
					jwtPart({ alg: "none", typ: "JWT" }),
					jwtPart({ ...claims, ...(nonce ? { nonce } : {}) }),
					"",
				].join("."),
			},
		}),
	);
	await page.route(endpoint("userinfo"), (route) =>
		route.fulfill({ headers: CORS, json: claims }),
	);
}
