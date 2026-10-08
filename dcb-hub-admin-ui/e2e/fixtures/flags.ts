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
	// On dcb-service main and in no release, which is what "tracking main" means here.
	// Its absence was the second thing the coverage gate in serviceCapabilities.test.ts
	// found, after VITE_FEATURE_GUARDED_CLEANUP's absence from the legacy world.
	VITE_FEATURE_INSIGHTS_TRENDS: "true",
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

/**
 * Every feature flag this fixture knows about.
 *
 * Derived from the set above rather than listed again, so the "everything on" and
 * "everything off" worlds can never disagree about which flags exist - which is exactly
 * how the legacy fixture came to leave VITE_FEATURE_GUARDED_CLEANUP out.
 */
export const FEATURE_FLAG_KEYS: readonly string[] = Object.keys(
	ALL_FEATURES,
).filter((key) => key.startsWith("VITE_FEATURE_"));

/**
 * Every feature flag pinned OFF, for the 8.71.0 world.
 *
 * Pinned to "", never left absent. `readFlag` is `injected ?? import.meta.env[name]`,
 * so a key missing from `window.__APP_ENV__` falls through to whatever the BUNDLE
 * baked - and an e2e build on a developer machine bakes that developer's `.env`, which
 * has to enable the 9.x flags for local work against a 9.x dcb-service. "" does not
 * fall through, and reads as off.
 */
export const featuresOff = (): Record<string, string> =>
	Object.fromEntries(FEATURE_FLAG_KEYS.map((key) => [key, ""]));

/** Everything on, i.e. a deployment tracking dcb-service main and running Symposia. */
export async function useAllFeatures(page: Page) {
	await seedFeatures(page, ALL_FEATURES);
}

/**
 * The same deployment with named flags off, for a spec about what their absence does.
 *
 * Set to "", not deleted. The key used to be removed, on the reasoning that envsubst
 * renders an unset variable as the empty string so absent is the real shape of a deployment
 * that never set it. That is true of the deployment and false of this test: `readFlag`
 * is `injected ?? import.meta.env[name]`, so a removed key reads the value the bundle
 * baked instead. It passed only because `.env` happens to carry
 * VITE_FEATURE_SYMPOSIA=false; a developer who turns it on would have seen
 * symposia-disabled.spec.ts fail with nothing wrong in the diff.
 */
export async function useAllFeaturesExcept(page: Page, flags: string[]) {
	const env = { ...ALL_FEATURES };
	for (const flag of flags) {
		if (!(flag in env)) throw new Error(`${flag} is not in ALL_FEATURES`);
		env[flag] = "";
	}

	await seedFeatures(page, env);
}

async function seedFeatures(page: Page, env: Record<string, string>) {
	// getStandaloneConfig() short-circuits on window.__APP_ENV__, so seeding it
	// before any app script runs both sets the flags and spares the run a fetch of
	// inject_env.json that the preview server does not answer.
	await page.addInitScript((seeded) => {
		// A fixture seeds the subset a spec cares about, while the application's own
		// type names every key a deployment can supply - so the cast is the
		// difference between the two, not a looseness. Narrowing the app's type to
		// make this assign would weaken the contract the app relies on.
		window.__APP_ENV__ = seeded as NonNullable<typeof window.__APP_ENV__>;
	}, env);
}
