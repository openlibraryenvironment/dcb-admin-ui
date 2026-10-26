import {
	selectPages,
	type InsightsPage,
	type Selection,
} from "@helpers/insightsPages";

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
 * Whether this deployment runs Symposia, the discovery product — VITE_FEATURE_SYMPOSIA.
 *
 * Not a dcb-service capability: it says what the CONSORTIUM runs, not what the server
 * serves, so it has no version threshold and no row in @constants/serviceCapabilities.
 * A deployment with no discovery front end has no use for the surfaces that configure one,
 * and an administrator offered them has no way to tell they do nothing.
 *
 * It gates only what a patron would see through Symposia. A library's own `discoverySystem`
 * is that library's OPAC and is unaffected, and so is the consortium's own chrome.
 */
export const isSymposiaEnabled = (): boolean =>
	readFlag("VITE_FEATURE_SYMPOSIA");

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
 * Confirming a request's item is back at the supplying library — a dcb-service route first
 * released in 9.2.0 (POST .../transition/confirm-returned). Older servers answer 404.
 */
export const isConfirmItemReturnedEnabled = (): boolean =>
	readFlag("VITE_FEATURE_CONFIRM_ITEM_RETURNED");

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
 * Patron announcements, first released in dcb-service 9.2.0. Asking an older deployment
 * for `announcements` is a validation error that fails the whole operation, so this
 * changes the DOCUMENT, not only what renders.
 *
 * ANDed with Symposia, which is what displays them.
 */
export const isAnnouncementsEnabled = (): boolean =>
	isSymposiaEnabled() && readFlag("VITE_FEATURE_ANNOUNCEMENTS");

/**
 * The consortium's support link, first released in dcb-service 9.2.0. Setting this flag
 * against an older one fails LoadConsortium whole.
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
 * `auditIncidence` is on dcb-service `feat/analytics`, which is unmerged, and in no
 * release - not 8.71.0, not the 9.0.0 tag, not 9.1.0, not main. schema.graphqls carries
 * it from that branch so its documents can be validated. Do not switch this on against a
 * release expecting it to work - see SERVICE_CAPABILITIES in @constants/serviceCapabilities.
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
 * The configuration and auth profile checks on creating or updating a Host LMS, and the
 * last connectivity check kept on each Host LMS: first released in dcb-service 9.2.0.
 * These gate the mutation and query DOCUMENTS: selecting them against an older dcb-service
 * fails the whole operation.
 */
export const isHostLmsProbesEnabled = (): boolean =>
	readFlag("VITE_FEATURE_HOST_LMS_PROBES");

/**
 * Percentile trends — `/insights/trend`, first released in dcb-service 9.1.0. So a 9.0.0
 * deployment has the Insights surface and 404s this one endpoint.
 *
 * Unlike the branding flags this gates a RENDER, not a document: the three rate trends
 * beside it come from `/insights/timeseries`, which every Insights deployment has.
 */
export const isInsightsTrendsEnabled = (): boolean =>
	readFlag("VITE_FEATURE_INSIGHTS_TRENDS");

/**
 * Settings inheritance: `resolvedFunctionalSettings`, `settingsBearingGroupType` and the two
 * scoped write mutations, on no dcb-service release yet. Gates the DOCUMENT, not only the
 * render — an undeclared field fails the whole operation. Separate from
 * VITE_FEATURE_ANNOUNCEMENTS: the two need not ship in the same release.
 */
export const isSettingsInheritanceEnabled = (): boolean =>
	readFlag("VITE_FEATURE_SETTINGS_INHERITANCE");

/**
 * Shelf browse: `Library.classificationScheme` and its input field, first released in
 * dcb-service 9.2.0. Gates the DOCUMENT and the mutation VARIABLES of LoadLibraryBasics and UpdateLibrary,
 * since an undeclared field fails the whole operation. Separate from
 * VITE_FEATURE_SETTINGS_INHERITANCE: the two need not ship in the same release.
 *
 * The scheme exists to order a Symposia shelf browse, so this is off wherever Symposia is.
 */
export const isShelfBrowseEnabled = (): boolean =>
	isSymposiaEnabled() && readFlag("VITE_FEATURE_SHELF_BROWSE");

/**
 * The consortium's request tag list (`requestTags` and its create, update and delete) and
 * the tags on a patron request (`tags`, `tagPatronRequest`, `untagPatronRequest`): first
 * released in dcb-service 9.2.0. Gates the DOCUMENTS: selecting them against an older
 * dcb-service fails the whole operation.
 */
export const isRequestTagsEnabled = (): boolean =>
	readFlag("VITE_FEATURE_REQUEST_TAGS");

/**
 * The notes on a patron request (`notes`, `addPatronRequestNote`,
 * `retractPatronRequestNote`): first released in dcb-service 9.2.0. Gates the documents.
 */
export const isRequestNotesEnabled = (): boolean =>
	readFlag("VITE_FEATURE_REQUEST_NOTES");

/**
 * Whether staff or the patron placed a request (`PatronRequest.placedByStaff`): first
 * released in dcb-service 9.2.0. Gates the documents.
 */
export const isPlacedByStaffEnabled = (): boolean =>
	readFlag("VITE_FEATURE_PLACED_BY_STAFF");

/** A setting that is not on or off, read from where readFlag reads. */
const readSetting = (name: string): string | undefined => {
	const injected =
		typeof window !== "undefined" ? window.__APP_ENV__?.[name] : undefined;
	const value = injected ?? import.meta.env[name];
	return typeof value === "string" ? value : undefined;
};

/** Parsed once per value, and a name it does not know reported once: docs/deployment.md, 2b. */
export const readSelection = <Name extends string>(
	name: string,
	parse: (raw: string | undefined) => Selection<Name>,
	warnUnknown: () => void,
) => {
	let last: { raw: string | undefined; shown: ReadonlySet<Name> } | undefined;
	return (): ReadonlySet<Name> => {
		const raw = readSetting(name);
		if (!last || last.raw !== raw) {
			const { shown, unknown } = parse(raw);
			if (unknown.length > 0) warnUnknown();
			last = { raw, shown };
		}
		return last.shown;
	};
};

const insightsPages = readSelection("VITE_INSIGHTS_PAGES", selectPages, () =>
	console.warn(
		"VITE_INSIGHTS_PAGES names a page this app does not have: docs/deployment.md, 2b",
	),
);
/** An Insights page this deployment shows: VITE_INSIGHTS_PAGES, within VITE_FEATURE_INSIGHTS. */
export const isInsightsPageShown = (page: InsightsPage): boolean =>
	isInsightsEnabled() && insightsPages().has(page);
