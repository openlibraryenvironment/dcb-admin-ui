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

const ALL_FEATURES: Record<string, string> = {
	VITE_MUI_X_LICENSE_KEY: "",
	VITE_KEYCLOAK_URL: "https://e2e-fake-keycloak.invalid/realms/dcb",
	VITE_KEYCLOAK_ID: "dcb-admin-e2e",
	VITE_DCB_API_BASE: "http://localhost:4173/api",
	VITE_DCB_SEARCH_BASE: "http://localhost:4173/search",
	VITE_DISCOVERY_URL: "https://discovery.e2e.invalid/",
	VITE_FEATURE_INSIGHTS: "true",
	VITE_FEATURE_AUDIT_EXPLORER: "true",
	VITE_FEATURE_CONSORTIUM_BRANDING: "true",
	VITE_FEATURE_CONSORTIUM_SUPPORT_URL: "true",
	VITE_FEATURE_ANNOUNCEMENTS: "true",
	VITE_FEATURE_NCIP_ONBOARDING: "true",
	VITE_FEATURE_LIBRARY_USER_PROVISIONING: "true",
	VITE_FEATURE_GUARDED_CLEANUP: "true",
	// Was missing: this fixture says "everything on", and a flag left out of it
	// silently tests the legacy path in every spec that asks for the new one.
	VITE_FEATURE_LOCAL_HOLDS: "true",
	VITE_FEATURE_SETTINGS_INHERITANCE: "true",
	VITE_FEATURE_SHELF_BROWSE: "true",
	VITE_FEATURE_SYMPOSIA: "true",
};

/** Everything on, i.e. a deployment tracking dcb-service main and running Symposia. */
export async function useAllFeatures(page: Page) {
	await seedFeatures(page, ALL_FEATURES);
}

/**
 * The same deployment with named flags removed, for a spec about what their absence does.
 *
 * Removed, not set to "false": envsubst renders an unset variable as the empty string, so
 * absent is the shape a deployment that has never set it actually has.
 */
export async function useAllFeaturesExcept(page: Page, flags: string[]) {
	const env = { ...ALL_FEATURES };
	for (const flag of flags) {
		if (!(flag in env)) throw new Error(`${flag} is not in ALL_FEATURES`);
		delete env[flag];
	}

	await seedFeatures(page, env);
}

async function seedFeatures(page: Page, env: Record<string, string>) {
	// getStandaloneConfig() short-circuits on window.__APP_ENV__, so seeding it
	// before any app script runs both sets the flags and spares the run a fetch of
	// inject_env.json that the preview server does not answer.
	await page.addInitScript((seeded) => {
		window.__APP_ENV__ = seeded;
	}, env);
}
