import {
	isAuditExplorerEnabled,
	isConsortiumBrandingEnabled,
	isInsightsEnabled,
	isLibraryUserProvisioningEnabled,
	isNcipOnboardingEnabled,
} from "@helpers/featureFlags";

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
}

export const SERVICE_CAPABILITIES: ReadonlyArray<ServiceCapability> = [
	{
		id: "consortium_branding",
		flag: "VITE_FEATURE_CONSORTIUM_BRANDING",
		enabled: isConsortiumBrandingEnabled,
		since: "9.0.0",
	},
	{
		id: "ncip_onboarding",
		flag: "VITE_FEATURE_NCIP_ONBOARDING",
		enabled: isNcipOnboardingEnabled,
		since: "9.0.0",
	},
	{
		id: "insights",
		flag: "VITE_FEATURE_INSIGHTS",
		enabled: isInsightsEnabled,
		since: "9.0.0",
	},
	{
		// NOT 9.0.0. On dcb-service main only, which is why the flags are per
		// capability rather than per release.
		id: "library_user_provisioning",
		flag: "VITE_FEATURE_LIBRARY_USER_PROVISIONING",
		enabled: isLibraryUserProvisioningEnabled,
		since: null,
	},
	{
		// `auditIncidence` is in no dcb-service branch yet, not even main.
		id: "audit_explorer",
		flag: "VITE_FEATURE_AUDIT_EXPLORER",
		enabled: isAuditExplorerEnabled,
		since: null,
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
