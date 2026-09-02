import type { Page } from "@playwright/test";

/**
 * A deployment running dcb-service 8.71.0 — R-19.
 *
 * The next DCB Admin release has to run against 8.71.0 as well as 9.0.0, because v9
 * takes time to reach production. This fixture is what "against 8.71.0" means in a
 * browser: every runtime flag off, a consortium that answers with the PRE-migration
 * brand columns and none of the merged ones, an `/info` with no branding block, and a
 * 404 from every route 9.0.0 introduced.
 *
 * It deliberately does NOT just turn the flags off. Answering with the 9.0.0 shape
 * anyway would let a document that still asks for `brandLogoUrl` pass, which is the
 * exact defect these specs exist to catch. The mock answers what the old server
 * answers, and nothing more.
 */

const API_BASE = "http://localhost:4173/api";

/** The runtime config an 8.71.0 environment renders: every feature flag off. */
export async function useLegacyService(page: Page) {
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
			// envsubst renders an unset variable as the empty string, which readFlag
			// reads as false. This is what an environment that has never heard of the
			// flags actually looks like.
			VITE_FEATURE_INSIGHTS: "",
			VITE_FEATURE_AUDIT_EXPLORER: "",
			VITE_FEATURE_CONSORTIUM_BRANDING: "",
			VITE_FEATURE_NCIP_ONBOARDING: "",
			VITE_FEATURE_LIBRARY_USER_PROVISIONING: "",
		};
	});

	// `/info` from 8.71.0: a version, and no dcb.branding block at all - that block is
	// only published when a BrandAssetStore bean exists, which is a 9.0.0 thing.
	await page.route("**/info", (route) =>
		route.fulfill({
			json: {
				version: "8.71.0",
				branch: "main",
				env: { code: "e2e" },
			},
		}),
	);

	// Every route 9.0.0 introduced. A test that reaches one of these has found a
	// surface the flags failed to gate.
	for (const path of [
		`${API_BASE}/brand-assets`,
		`${API_BASE}/api/v1/dcb-profile-ncip2/**`,
		`${API_BASE}/insights/**`,
		`${API_BASE}/insights`,
	]) {
		await page.route(path, (route) =>
			route.fulfill({ status: 404, json: { message: "Not Found" } }),
		);
	}
}

export const LEGACY_CONSORTIUM = {
	id: "e2e-consortium",
	name: "e2e-consortium",
	displayName: "E2E Consortium",
	libraryGroup: { id: "e2e-group" },
	dateOfLaunch: "2024-01-01",
	description: "A consortium on the release before v9.",
	catalogueSearchUrl: "https://catalogue.example.invalid",
	websiteUrl: "https://example.invalid",
	// The pre-migration columns, and ONLY those. V9_0_004 has not run on this server.
	headerImageUrl: "https://example.invalid/legacy-header-icon.png",
	aboutImageUrl: "https://example.invalid/legacy-logo.png",
	contacts: [{ id: "contact-1", email: "someone@example.invalid" }],
	functionalSettings: [],
};

/**
 * The GraphQL answers an 8.71.0 server gives to the consortium documents.
 *
 * Pass these to mockGraphQL alongside whatever else a spec needs.
 */
export const legacyConsortiumMocks = {
	LoadConsortium: {
		consortia: { totalSize: 1, content: [LEGACY_CONSORTIUM] },
	},
	LoadConsortiumHeader: {
		consortia: {
			totalSize: 1,
			content: [
				{
					id: LEGACY_CONSORTIUM.id,
					name: LEGACY_CONSORTIUM.name,
					displayName: LEGACY_CONSORTIUM.displayName,
					libraryGroup: LEGACY_CONSORTIUM.libraryGroup,
					headerImageUrl: LEGACY_CONSORTIUM.headerImageUrl,
					aboutImageUrl: LEGACY_CONSORTIUM.aboutImageUrl,
					description: LEGACY_CONSORTIUM.description,
					catalogueSearchUrl: LEGACY_CONSORTIUM.catalogueSearchUrl,
					websiteUrl: LEGACY_CONSORTIUM.websiteUrl,
				},
			],
		},
	},
};

/**
 * The brand fields 9.0.0 introduced. Nothing sent to an 8.71.0 server may name one:
 * an undeclared field is a validation error that fails the whole operation, which is
 * why these specs assert on the REQUEST and not only on what renders.
 */
export const V9_ONLY_FIELDS = [
	"brandLogoUrl",
	"brandLogoAlt",
	"brandHeaderIconUrl",
	"brandBackgroundImageUrl",
	"patronWelcome",
	"defaultThemeName",
];
