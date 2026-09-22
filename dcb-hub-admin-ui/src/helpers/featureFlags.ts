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
 * The guarded cleanup flow — dcb-service 9.0.0 and later.
 *
 * 9.0.0 refuses a cleanup that would delete the borrowing library's virtual records while
 * the item is out, with a 409 carrying the offending status, and accepts force=true to
 * override it. 8.71.0 has neither the refusal nor the override: it cleans up whatever it is
 * asked to. So with this off, the UI's own status list stays the only gate.
 */
export const isGuardedCleanupEnabled = (): boolean =>
	readFlag("VITE_FEATURE_GUARDED_CLEANUP");

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
 * The consortium's support link — dcb-service AFTER 9.0.0, V-11.1.
 *
 * `consortium.support_url` arrived in V9_0_008, which is on main and in no release, so
 * this is a SEPARATE flag from the branding one above rather than a sixth field on it.
 * Selecting `supportUrl` against the 9.0.0 tag fails LoadConsortium whole, exactly as the
 * brand fields do against 8.71.0 — same failure, different threshold, which is the entire
 * reason the flags are per capability.
 *
 * `websiteUrl` beside it is ungated: Consortium has carried it since 6.2.0.
 */
export const isConsortiumSupportUrlEnabled = (): boolean =>
	readFlag("VITE_FEATURE_CONSORTIUM_SUPPORT_URL");

/**
 * DCB NCIP onboarding — dcb-service 9.0.0 and later.
 *
 * DcbProfileRegistrationController serves /api/v1/dcb-profile-ncip2 and does not exist
 * before 9.0.0, so on an older deployment the whole page can only 404.
 */
export const isNcipOnboardingEnabled = (): boolean =>
	readFlag("VITE_FEATURE_NCIP_ONBOARDING");

/**
 * DCB Admin for Libraries account provisioning — dcb-service 9.1.0 and later.
 *
 * Note the threshold: libraryUsers, libraryUserProvisioningAvailable,
 * provisionLibraryUser, setLibraryUserEnabled and resendLibraryUserInvite shipped in
 * 9.1.0. They are in neither 8.71.0 nor the 9.0.0 tag, which is why this is not the same
 * flag as the branding one below - 9.0.0 has the brand columns and none of these.
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
 * `auditIncidence` is in no dcb-service anywhere - not 8.71.0, not the 9.0.0 tag, not
 * main, not any branch. It exists only as a hand-written block in this app's
 * schema.graphqls so its documents can be validated. Do not switch this on expecting it
 * to work - see SERVICE_CAPABILITIES in @constants/serviceCapabilities.
 */
export const isAuditExplorerEnabled = (): boolean =>
	readFlag("VITE_FEATURE_AUDIT_EXPLORER");

/**
 * Per-agency maximum local holds — dcb-service 9.1.0 and later.
 *
 * `maxLocalHolds` was added to Agency, UpdateAgencyInput and LibraryInput by
 * V9_0_007__agency_max_local_holds.sql and shipped in 9.1.0. It is in neither 8.71.0 nor
 * the 9.0.0 tag, so selecting it against either is a validation error that fails the whole
 * operation - LoadLibraryBasics and UpdateAgency both, which is the library settings tab.
 *
 * So this gates a DOCUMENT and the mutation VARIABLES, not a rendered control.
 * See src/graphql/fragments/localHolds.ts.
 */
export const isLocalHoldsEnabled = (): boolean =>
	readFlag("VITE_FEATURE_LOCAL_HOLDS");

/**
 * Percentile trends — `/insights/trend`, on dcb-service branch `insights-improvements`
 * and in NO release, not 8.71.0 and not the 9.0.0 tag.
 *
 * Separate from VITE_FEATURE_INSIGHTS for the reason every flag here is separate: the
 * thresholds differ. A deployment on 9.0.0 has the Insights surface and answers 404 to
 * this one endpoint, and a 404 rendered through the panel contract reads as "this panel
 * could not be loaded" - a fault report for a server that is simply older.
 *
 * Unlike the branding flags this gates a RENDER, not a document: the three rate trends
 * beside it come from `/insights/timeseries`, which every Insights deployment has, so the
 * subject is useful with this off.
 */
export const isInsightsTrendsEnabled = (): boolean =>
	readFlag("VITE_FEATURE_INSIGHTS_TRENDS");
