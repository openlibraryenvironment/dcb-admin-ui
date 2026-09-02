/**
 * Runtime feature flags.
 *
 * Deliberately read from the injected runtime config (`window.__APP_ENV__`,
 * populated in main.tsx from /inject_env.json) rather than from
 * `import.meta.env` at build time: a flag that gates a feature on a *backend*
 * release has to be flippable per environment without rebuilding and
 * redeploying the UI. The import.meta.env read is only the local-dev fallback,
 * mirroring getEnvConfig() in homeData/homeConfig.ts.
 *
 * Flags are off unless explicitly turned on, so an environment that has never
 * heard of the flag hides the feature.
 */
const readFlag = (name: string): boolean => {
	const injected =
		typeof window !== "undefined" ? window.__APP_ENV__?.[name] : undefined;
	const value = injected ?? import.meta.env[name];

	return String(value).toLowerCase() === "true";
};

/**
 * Insights depends on the /insights endpoints, first released in dcb-service 9.0.0.
 * Enable with VITE_FEATURE_INSIGHTS=true once the environment's dcb-service is new
 * enough; an older one answers 404 to all of them.
 */
export const isInsightsEnabled = (): boolean =>
	readFlag("VITE_FEATURE_INSIGHTS");

/**
 * The consortium brand — dcb-service 9.0.0 and later.
 *
 * THIS FLAG IS NOT A RENDER SWITCH. V9_0_004 replaced headerImageUrl/aboutImageUrl and
 * their four uploader columns with brandLogoUrl, brandLogoAlt, brandHeaderIconUrl,
 * brandBackgroundImageUrl, patronWelcome and defaultThemeName. A GraphQL field the
 * server has never heard of is not a null - it is a validation error that fails the
 * WHOLE operation - so against 8.71.0 selecting them takes down LoadConsortium and
 * LoadConsortiumHeader entirely, which is the setup wizard, the consortium section and
 * the header on every page.
 *
 * So the flag changes the DOCUMENT and the mutation VARIABLES before they are sent.
 * See src/graphql/selections/consortiumBrand.ts.
 *
 * It also gates the /consortium/branding tab, setup's Discovery chapter and the brand
 * image upload controls, all of which need surfaces 8.71.0 does not have.
 */
export const isConsortiumBrandingEnabled = (): boolean =>
	readFlag("VITE_FEATURE_CONSORTIUM_BRANDING");

/**
 * DCB NCIP onboarding — dcb-service 9.0.0 and later.
 *
 * DcbProfileRegistrationController serves /api/v1/dcb-profile-ncip2 and does not exist
 * before 9.0.0, so on an older deployment the whole page can only 404.
 */
export const isNcipOnboardingEnabled = (): boolean =>
	readFlag("VITE_FEATURE_NCIP_ONBOARDING");

/**
 * DCB Admin for Libraries account provisioning — dcb-service AFTER 9.0.0.
 *
 * Note the threshold: libraryUsers, libraryUserProvisioningAvailable,
 * provisionLibraryUser, setLibraryUserEnabled and resendLibraryUserInvite are on
 * dcb-service feat/library-account-provisioning - not main, not the 9.0.0 tag, not any
 * release. That service branch must merge first. This is why there is no single
 * "dcb-service is v9" flag - it would be a lie about this feature and about the audit
 * explorer below, and turning it on when v9 landed would break both.
 *
 * Like the brand flag, this one gates a DOCUMENT: the fields are absent from 9.0.0's
 * schema too, so the query fails validation there as well.
 */
export const isLibraryUserProvisioningEnabled = (): boolean =>
	readFlag("VITE_FEATURE_LIBRARY_USER_PROVISIONING");

/**
 * The Audit Explorer depends on the `auditIncidence` aggregation endpoint and the
 * audit search behaviour that only exist in the upcoming dcb-service release.
 * Enable with VITE_FEATURE_AUDIT_EXPLORER=true once the environment's dcb-service
 * is new enough.
 *
 * As of dcb-service 9.0.0 that release does not exist yet: `auditIncidence` is in
 * neither 8.71.0, nor the 9.0.0 tag, nor main. Do not switch this on expecting it to
 * work - see SERVICE_CAPABILITIES in @constants/serviceCapabilities.
 */
export const isAuditExplorerEnabled = (): boolean =>
	readFlag("VITE_FEATURE_AUDIT_EXPLORER");
