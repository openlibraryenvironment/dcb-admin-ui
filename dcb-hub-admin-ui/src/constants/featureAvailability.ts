import {
	SERVICE_CAPABILITIES,
	meetsServiceVersion,
	type CapabilityStatus,
	type ServiceCapability,
} from "@constants/serviceCapabilities";

/**
 * One row of the Feature availability panel. A row can stand for more than one capability,
 * and the registry keeps every capability whether or not a row shows it: what is shown
 * changes no flag, no document and no conformance check.
 */
export interface AvailabilityEntry {
	/** The i18n key suffix under `service_capabilities.feature.`. */
	id: string;
	capabilities: ReadonlyArray<ServiceCapability>;
	/** The release the row says it needs. */
	since: string;
}

const capability = (id: string): ServiceCapability => {
	const found = SERVICE_CAPABILITIES.find((entry) => entry.id === id);
	if (!found) throw new Error(`No capability "${id}" in SERVICE_CAPABILITIES`);
	return found;
};

const shown = (id: string): AvailabilityEntry => {
	const entry = capability(id);
	if (entry.since === null) throw new Error(`"${id}" is in no release`);
	return { id, capabilities: [entry], since: entry.since };
};

export const FEATURE_AVAILABILITY: ReadonlyArray<AvailabilityEntry> = [
	shown("consortium_branding"),
	shown("ncip_onboarding"),
	{
		id: "insights",
		capabilities: [capability("insights"), capability("insights_trends")],
		// Every endpoint DCB Admin calls is served from 9.1.0, but the most requested titles
		// come out of order before 9.2.0 (dcb-service 46ba1829d)
		since: "9.2.0",
	},
	shown("guarded_cleanup"),
	shown("local_holds"),
	shown("consortium_support_url"),
	shown("host_lms_probes"),
	shown("announcements"),
	shown("request_tags"),
	shown("request_notes"),
];

/**
 * An entry is on when every flag it stands for is on, and switched on too early when any
 * of them is: one flag on ahead of the upgrade is enough to break its pages.
 */
export const availabilityStatus = (
	entry: AvailabilityEntry,
	version: string | null | undefined,
): CapabilityStatus => {
	const flags = entry.capabilities.map((capability) => capability.enabled());
	const served = meetsServiceVersion(version, entry.since);

	if (served === null) return "unknown";
	if (served) return flags.every(Boolean) ? "ready" : "available";
	return flags.some(Boolean) ? "premature" : "unavailable";
};
