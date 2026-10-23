import { durationSeconds } from "./scheduledWork";

export interface IngestSourceSetting {
	/** The Host LMS name, as /info keys it: anything but letters and digits becomes "-". */
	key: string;
	enabled: boolean | null;
}

/** Settings /info reports that support asks about. Null where this dcb-service does not report one. */
export interface ServiceConfiguration {
	searchBackend: { distribution: string; version: string | null } | null;
	placementCheckTimeoutSeconds: number | null;
	staffClientIds: string[] | null;
	duplicateRequestCheck: boolean | null;
	brandAssetStore: string | null;
	ingestSources: IngestSourceSetting[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const at = (record: unknown, ...path: string[]): unknown =>
	path.reduce<unknown>(
		(node, key) => (isRecord(node) ? node[key] : undefined),
		record,
	);

const text = (value: unknown): string | null =>
	typeof value === "string" && value.trim() !== "" ? value.trim() : null;

const flag = (value: unknown): boolean | null =>
	value === true || value === "true"
		? true
		: value === false || value === "false"
			? false
			: null;

/** What /info says about how this dcb-service is configured. Null when /info could not be read. */
export function serviceConfigurationFrom(
	info: unknown,
): ServiceConfiguration | null {
	if (!isRecord(info)) return null;

	const requests = at(info, "dcb", "requests");
	const distribution = text(
		at(info, "dcb", "index", "backend", "distribution"),
	);
	const staffClientIds = text(at(requests, "staff-client-ids"));
	const duplicate = at(
		requests,
		"preflight-checks",
		"duplicate-requests",
		"enabled",
	);
	const brandStore = at(info, "dcb", "branding", "assets", "store");
	const sources = at(info, "dcb", "ingest", "sources");

	return {
		searchBackend: distribution
			? {
					distribution,
					version: text(at(info, "dcb", "index", "backend", "version")),
				}
			: null,
		placementCheckTimeoutSeconds: durationSeconds(
			at(requests, "preflight-checks", "timeout"),
		),
		staffClientIds: staffClientIds
			? staffClientIds
					.split(",")
					.map((id) => id.trim())
					.filter((id) => id !== "")
			: null,
		// /info reports an unset property as "". Unset, the check is off: @Requires defaultValue "false"
		duplicateRequestCheck:
			duplicate === undefined ? null : (flag(duplicate) ?? false),
		// Unset, dcb-service stores brand assets in its database (DatabaseBrandAssetStore)
		brandAssetStore:
			brandStore === undefined ? null : (text(brandStore) ?? "database"),
		// One per Host LMS that ingests: tens in a consortium, never record-scaled
		ingestSources: isRecord(sources)
			? Object.entries(sources)
					.map(([key, source]) => ({
						key,
						enabled: flag(at(source, "enabled")),
					}))
					.sort((a, b) => a.key.localeCompare(b.key))
			: [],
	};
}
