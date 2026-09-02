import {
	isAuditExplorerEnabled,
	isConsortiumBrandingEnabled,
	isInsightsEnabled,
	isLibraryUserProvisioningEnabled,
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
 * Read the `since` column. Three of these arrived in 9.0.0, one is only on dcb-service
 * main and is not in the 9.0.0 tag, and one is in no release at all. One boolean would
 * be a lie about two of them, and turning it on when v9 landed would break both.
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
		id: "consortium_branding",
		flag: "VITE_FEATURE_CONSORTIUM_BRANDING",
		enabled: isConsortiumBrandingEnabled,
		since: "9.0.0",
		fields: {
			Consortium: CONSORTIUM_BRAND_FIELDS,
			UpdateConsortiumInput: CONSORTIUM_BRAND_FIELDS,
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
		// NOT 9.0.0, and NOT main either: this API lives on dcb-service
		// feat/library-account-provisioning, which has not merged. That service branch
		// must land before this app's feat/library-accounts does. It is exactly why the
		// flags are per capability rather than per release.
		id: "library_user_provisioning",
		flag: "VITE_FEATURE_LIBRARY_USER_PROVISIONING",
		enabled: isLibraryUserProvisioningEnabled,
		since: null,
		// Whole ROOT fields, so there is nothing here for the selection builder to do -
		// the documents are gated at the route instead. They are listed anyway, and
		// `Query`/`Mutation` are types like any other, because listing them is what makes
		// `since: null` a CHECKED claim: serviceCapabilities.test.ts asserts these exist
		// in the target schema and in none of the releases we hold. The day somebody
		// commits the schema of the release that ships them, that test fails and says to
		// set `since` - which is the whole reason this is a registry and not a comment.
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
		// `auditIncidence` is in no dcb-service branch yet, not even main. It is in
		// schema.graphqls by hand - see that file's header - so this row is checked the
		// same way as the one above.
		id: "audit_explorer",
		flag: "VITE_FEATURE_AUDIT_EXPLORER",
		enabled: isAuditExplorerEnabled,
		since: null,
		fields: { Query: ["auditIncidence"] },
	},
];

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
