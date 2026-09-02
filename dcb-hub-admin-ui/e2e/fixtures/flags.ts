import type { Page } from "@playwright/test";

/**
 * The runtime feature flags, for a spec that needs a particular dcb-service — R-19.
 *
 * DCB Admin runs against dcb-service 8.71.0 and 9.0.0 alike, with the newer features
 * behind flags read from `window.__APP_ENV__`. A spec that does not say which world it
 * is in gets whatever the e2e build baked, which is nothing - i.e. every flag off - and
 * that is a real deployment shape but rarely the one the spec means. Say it explicitly.
 *
 * `useLegacyService` in legacy-service-mocks.ts is the other half: flags off AND a
 * server that answers like 8.71.0.
 */

/** Everything on, i.e. a deployment tracking dcb-service main. */
export async function useAllFeatures(page: Page) {
	await page.addInitScript(() => {
		// getStandaloneConfig() short-circuits on window.__APP_ENV__, so seeding it
		// before any app script runs both sets the flags and spares the run a fetch of
		// inject_env.json that the preview server does not answer.
		window.__APP_ENV__ = {
			VITE_MUI_X_LICENSE_KEY: "",
			VITE_KEYCLOAK_URL: "https://e2e-fake-keycloak.invalid/realms/dcb",
			VITE_KEYCLOAK_ID: "dcb-admin-e2e",
			VITE_DCB_API_BASE: "http://localhost:4173/api",
			VITE_DCB_SEARCH_BASE: "http://localhost:4173/search",
			VITE_FEATURE_INSIGHTS: "true",
			VITE_FEATURE_AUDIT_EXPLORER: "true",
			VITE_FEATURE_CONSORTIUM_BRANDING: "true",
			VITE_FEATURE_NCIP_ONBOARDING: "true",
			VITE_FEATURE_LIBRARY_USER_PROVISIONING: "true",
		};
	});
}
