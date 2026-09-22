import {
	isAuditExplorerEnabled,
	isConsortiumBrandingEnabled,
	isConsortiumSupportUrlEnabled,
	isGuardedCleanupEnabled,
	isInsightsEnabled,
	isInsightsTrendsEnabled,
	isLibraryUserProvisioningEnabled,
	isLocalHoldsEnabled,
	isNcipOnboardingEnabled,
} from "@helpers/featureFlags";

/**
 * The six merged brand columns V9_0_004 introduced, and the two it replaced.
 *
 * Declared here rather than in the document that selects them, so the registry, the
 * selection builder and the variables filter all read one list — and so
 * serviceCapabilities.test.ts can check it against the schemas of the releases
 * themselves.
 */
export const CONSORTIUM_BRAND_FIELDS = [
	"brandLogoUrl",
	"brandLogoAlt",
	"brandHeaderIconUrl",
	"brandBackgroundImageUrl",
	"patronWelcome",
	"defaultThemeName",
] as const;

/** The app-bar mark and the logo, which is all the DCB Admin chrome itself renders. */
export const CONSORTIUM_BRAND_CHROME_FIELDS = [
	"brandHeaderIconUrl",
	"brandLogoUrl",
] as const;

/**
 * The consortium's support link, added by V9_0_008__support_url.sql — V-11.1.
 *
 * `websiteUrl` is deliberately NOT here. It has been on Consortium since 6.2.0, so it
 * needs no gate; only the column that arrived after the 9.0.0 tag does. Discovery renders
 * the two as separate links because "when do you open" and "your search is broken" are
 * different questions and rarely the same desk.
 */
export const CONSORTIUM_SUPPORT_FIELDS = ["supportUrl"] as const;

/**
 * The per-agency local holds limit, added by V9_0_007__agency_max_local_holds.sql.
 *
 * One name, three types. Declared here so the selection builder, the variables filter and
 * serviceCapabilities.test.ts all read the same list.
 */
export const LOCAL_HOLDS_FIELDS = ["maxLocalHolds"] as const;

/**
 * The per-library brand, added by the same 9.0.0 migration as the consortium's.
 *
 * Three fields, not six: a library has no landing hero to put a background behind and no
 * patron welcome of its own, and `patronWebsite` is already the logo's link target, so
 * there is no second URL. Read by dcb-admin-for-libraries' own library form - changing
 * this list is a cross-repo change.
 */
export const LIBRARY_BRAND_FIELDS = [
	"brandLogoUrl",
	"brandLogoAlt",
	"defaultThemeName",
] as const;

/** Their pre-migration equivalents, still present on dcb-service 8.71.0. */
export const CONSORTIUM_BRAND_LEGACY_FIELDS = [
	"headerImageUrl",
	"aboutImageUrl",
] as const;

/**
 * Which DCB Admin features need which dcb-service, and whether this deployment has
 * switched them on — R-19.
 *
 * <h2>Why the flag is the gate and the version is only evidence</h2>
 *
 * It is tempting to read `/info`'s version and turn the features on automatically. It
 * would be wrong here. `/info` is fetched asynchronously and cached in sessionStorage
 * for two hours; the header's consortium query fires before it can resolve. Deriving
 * the SHAPE OF A DOCUMENT from a racing fetch would let the first render of a session
 * pick its selection set by accident, and get a different answer on the next reload.
 * SNAPSHOT and branch builds make the version string an unreliable comparand besides.
 *
 * So the flag decides, and the version is how an operator finds out the switch is due -
 * and how a support engineer diagnoses "the branding tab vanished" in one screen rather
 * than one afternoon.
 *
 * <h2>Why there is no single "v9" flag</h2>
 *
 * Read the `since` column. It holds three different answers - 9.0.0, 9.1.0 and null -
 * and one boolean cannot carry three thresholds. Switched on at the v9 upgrade it would
 * be a lie about every row above 9.0.0, and each of those fails the whole operation
 * rather than degrading a panel.
 */

/** A GraphQL type name to the fields a capability adds to it. */
export type CapabilityFields = Readonly<Record<string, readonly string[]>>;

export interface ServiceCapability {
	/** Stable id; also the i18n key suffix under `service_capabilities.`. */
	id: string;
	/** The environment variable an operator sets. */
	flag: string;
	/** Whether it is on in THIS browser, read at call time. */
	enabled: () => boolean;
	/**
	 * The lowest dcb-service that serves it, or null when no release does yet.
	 * Inclusive: `since: "9.0.0"` means 9.0.0 is new enough.
	 */
	since: string | null;
	/**
	 * The GraphQL fields this capability adds, by the type they sit on — INPUT types
	 * included, because stripping a key from mutation variables is a separate job from
	 * leaving it out of a selection set, and both have to happen.
	 *
	 * Empty for a capability that is only REST (Insights) or only a route (NCIP
	 * onboarding). It is not decoration: `serviceCapabilities.test.ts` checks these
	 * against the committed release schemas, so a row claiming the wrong `since` fails
	 * the build instead of an environment.
	 */
	fields: CapabilityFields;
	/**
	 * What an older deployment carries instead, by type. Only for a capability that
	 * RENAMED something: V9_0_004 replaced two consortium columns that still exist
	 * under their old names before it, and selecting nothing there would visibly remove
	 * branding a deployment already shows.
	 */
	fallback?: CapabilityFields;
}

export const SERVICE_CAPABILITIES: ReadonlyArray<ServiceCapability> = [
	{
		// The library's brand is on this row rather than one of its own because the
		// THRESHOLD is the same - V9_0_004 added both. A second row would mean a second
		// flag, and two flags that can never sensibly differ are two chances to set one
		// of them wrong. The rows below are separate because their thresholds differ.
		id: "consortium_branding",
		flag: "VITE_FEATURE_CONSORTIUM_BRANDING",
		enabled: isConsortiumBrandingEnabled,
		since: "9.0.0",
		fields: {
			Consortium: CONSORTIUM_BRAND_FIELDS,
			UpdateConsortiumInput: CONSORTIUM_BRAND_FIELDS,
			Library: LIBRARY_BRAND_FIELDS,
			UpdateLibraryInput: LIBRARY_BRAND_FIELDS,
		},
		// The pre-migration columns. Read, never written: the branding form is hidden
		// before 9.0.0, so nothing sends these.
		fallback: { Consortium: CONSORTIUM_BRAND_LEGACY_FIELDS },
	},
	{
		id: "ncip_onboarding",
		flag: "VITE_FEATURE_NCIP_ONBOARDING",
		enabled: isNcipOnboardingEnabled,
		since: "9.0.0",
		// A REST controller, not a schema change. Nothing to select or strip.
		fields: {},
	},
	{
		id: "insights",
		flag: "VITE_FEATURE_INSIGHTS",
		enabled: isInsightsEnabled,
		since: "9.0.0",
		fields: {},
	},
	{
		// `/insights/trend` is on dcb-service branch `insights-improvements` and in no
		// release. A REST endpoint, not a schema change, so there is nothing to select or
		// strip - and a SEPARATE row from `insights`, whose `since` is 9.0.0: a
		// deployment on the release has the surface and 404s this one path.
		id: "insights_trends",
		flag: "VITE_FEATURE_INSIGHTS_TRENDS",
		enabled: isInsightsTrendsEnabled,
		since: null,
		fields: {},
	},
	{
		// The cleanup guard, its 409 and the force override are REST behaviour rather than
		// schema, so there is nothing to select or strip.
		id: "guarded_cleanup",
		flag: "VITE_FEATURE_GUARDED_CLEANUP",
		enabled: isGuardedCleanupEnabled,
		since: "9.0.0",
		fields: {},
	},
	{
		// Shipped in 9.1.0. It carried `since: null` while the work sat on main, and the
		// claim outlived the release by six days because the 9.1.0 schema was not
		// committed here - the test below can only compare against releases it holds.
		id: "library_user_provisioning",
		flag: "VITE_FEATURE_LIBRARY_USER_PROVISIONING",
		enabled: isLibraryUserProvisioningEnabled,
		since: "9.1.0",
		// Whole ROOT fields, so there is nothing here for the selection builder to do -
		// the documents are gated at the route instead. They are listed anyway, and
		// `Query`/`Mutation` are types like any other, because listing them is what makes
		// the `since` a CHECKED claim: serviceCapabilities.test.ts asserts these exist in
		// 9.1.0 and in no release before it.
		fields: {
			Query: ["libraryUsers", "libraryUserProvisioningAvailable"],
			Mutation: [
				"provisionLibraryUser",
				"setLibraryUserEnabled",
				"resendLibraryUserInvite",
			],
		},
	},
	{
		// Shipped in 9.1.0, by V9_0_007__agency_max_local_holds.sql. LibraryInput carries
		// it too, but nothing in this app sends that field on a library create, so only
		// the two types that are actually written appear here.
		id: "local_holds",
		flag: "VITE_FEATURE_LOCAL_HOLDS",
		enabled: isLocalHoldsEnabled,
		since: "9.1.0",
		fields: {
			Agency: LOCAL_HOLDS_FIELDS,
			UpdateAgencyInput: LOCAL_HOLDS_FIELDS,
		},
	},
	{
		// On dcb-service MAIN, and in no release: V9_0_008 landed after the 9.0.0 tag.
		// A SEPARATE row from consortium_branding, whose `since` is 9.0.0 — one flag over
		// both would be a lie about one of them, and switching it on at the v9 upgrade
		// would break the consortium form on every deployment running the release.
		id: "consortium_support_url",
		flag: "VITE_FEATURE_CONSORTIUM_SUPPORT_URL",
		enabled: isConsortiumSupportUrlEnabled,
		since: null,
		fields: {
			Consortium: CONSORTIUM_SUPPORT_FIELDS,
			UpdateConsortiumInput: CONSORTIUM_SUPPORT_FIELDS,
		},
	},
	{
		// `auditIncidence` is in no dcb-service anywhere - no release, not main, no branch.
		// It is in schema.graphqls by hand - see that file's header - so this row is
		// checked the same way as the one above.
		id: "audit_explorer",
		flag: "VITE_FEATURE_AUDIT_EXPLORER",
		enabled: isAuditExplorerEnabled,
		since: null,
		fields: { Query: ["auditIncidence"] },
	},
];

const byId = new Map(SERVICE_CAPABILITIES.map((entry) => [entry.id, entry]));

/**
 * One capability by id. Throws on an unknown one rather than returning undefined: a typo
 * at a call site would otherwise select nothing and read exactly like a deployment that
 * is too old, which is the failure this registry exists to make visible.
 */
export const capability = (id: string): ServiceCapability => {
	const found = byId.get(id);
	if (!found) {
		throw new Error(`Unknown service capability: ${id}`);
	}
	return found;
};

/**
 * The leading numeric triplet of a version string, or null when there is not one.
 *
 * Tolerant on purpose. `/info` answers "9.0.0", but also "9.1.0-SNAPSHOT" from a
 * development build and whatever a branch build cares to report. Anything this cannot
 * read confidently becomes null, and null is reported as "cannot tell" rather than
 * guessed - a wrong version comparison shown next to a flag is worse than no comparison,
 * because somebody would act on it.
 */
export const parseServiceVersion = (
	version: string | null | undefined,
): [number, number, number] | null => {
	const match = /^\s*v?(\d+)\.(\d+)\.(\d+)/.exec(version ?? "");
	return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
};

/**
 * dcb-service's own version from an `/info` payload, or null when it is not there.
 *
 * `git.build.version` is the Gradle project version: "8.71.0" on a release build,
 * "9.1.0-SNAPSHOT" on a development one. `/info` has no top-level `version`.
 */
export const serviceVersionFrom = (info: unknown): string | null => {
	const version = (info as { git?: { build?: { version?: unknown } } } | null)
		?.git?.build?.version;
	return typeof version === "string" && version !== "" ? version : null;
};

export type ReleaseStatus = "current" | "behind" | "ahead" | "unknown";

/** Where a running version stands against the latest release. "v2.0.0" and "2.0.0" compare equal. */
export const releaseStatus = (
	running: string | null,
	latest: string | undefined,
): ReleaseStatus => {
	const atLeastLatest = meetsServiceVersion(running, latest ?? "");
	const latestAtLeastRunning = meetsServiceVersion(latest ?? "", running ?? "");
	if (atLeastLatest === null || latestAtLeastRunning === null) return "unknown";
	if (atLeastLatest && latestAtLeastRunning) return "current";
	return atLeastLatest ? "ahead" : "behind";
};

/**
 * Whether `version` is at least `minimum`. Null when either cannot be read, which the
 * panel renders as "unknown" rather than as either answer.
 */
export const meetsServiceVersion = (
	version: string | null | undefined,
	minimum: string | null,
): boolean | null => {
	if (minimum === null) return false;

	const actual = parseServiceVersion(version);
	const wanted = parseServiceVersion(minimum);
	if (!actual || !wanted) return null;

	for (let i = 0; i < 3; i++) {
		if (actual[i] !== wanted[i]) return actual[i] > wanted[i];
	}
	return true;
};

/**
 * What to tell the operator about one capability on this deployment.
 *
 * Four states, and the two mismatches are the whole point of the panel:
 *  - `ready`      the service is new enough and the flag is on
 *  - `available`  the service is new enough and the flag is OFF - switch it on
 *  - `premature`  the flag is on but the service is too old - the feature will fail
 *  - `unavailable` neither, which is the ordinary state before an upgrade
 *  - `unknown`    the version could not be read; assert nothing
 */
export type CapabilityStatus =
	"ready" | "available" | "premature" | "unavailable" | "unknown";

export const capabilityStatus = (
	capability: ServiceCapability,
	version: string | null | undefined,
): CapabilityStatus => {
	const enabled = capability.enabled();
	const served = meetsServiceVersion(version, capability.since);

	if (served === null) return "unknown";
	if (served) return enabled ? "ready" : "available";
	return enabled ? "premature" : "unavailable";
};
