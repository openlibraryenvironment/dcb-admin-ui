/** One dcb-service instance, as /info's `dcbNodes` reports it. */
export interface DcbNode {
	id: string;
	name: string | null;
	runsScheduledWork: boolean | null;
	started: string | null;
	/** ISO 8601, from the epoch milliseconds /info reports. */
	lastHeartbeat: string | null;
}

export interface ScheduledWork {
	nodes: DcbNode[];
	/** `dcb.sheduled-tasks.enabled`: /info spells the key that way. */
	scheduledWorkEnabled: boolean | null;
	trackingInterval: string | null;
	trackingLastRunCount: number | null;
	trackingLastRunSeconds: number | null;
	harvestInterval: string | null;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const text = (value: unknown): string | null =>
	typeof value === "string" && value !== "" ? value : null;

const flag = (value: unknown): boolean | null =>
	value === true || value === "true"
		? true
		: value === false || value === "false"
			? false
			: null;

const at = (record: unknown, ...path: string[]): unknown =>
	path.reduce<unknown>(
		(node, key) => (isRecord(node) ? node[key] : undefined),
		record,
	);

/** "PT3.2098726S" -> 3.2; "PT1M5S" -> 65. Null for anything else. */
export function durationSeconds(iso: unknown): number | null {
	if (typeof iso !== "string") return null;
	const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/.exec(iso);
	if (!match || iso === "PT") return null;
	const [, hours, minutes, seconds] = match;
	const total =
		Number(hours ?? 0) * 3600 +
		Number(minutes ?? 0) * 60 +
		Number(seconds ?? 0);
	return Math.round(total * 10) / 10;
}

const heartbeat = (value: unknown): string | null => {
	const millis = typeof value === "number" ? value : Number(text(value));
	return Number.isFinite(millis) && millis > 0
		? new Date(millis).toISOString()
		: null;
};

/** What /info says about DCB's scheduled work. Null when /info could not be read. */
export function scheduledWorkFrom(info: unknown): ScheduledWork | null {
	if (!isRecord(info)) return null;

	const nodes = isRecord(info.dcbNodes)
		? Object.entries(info.dcbNodes).map(([id, node]) => ({
				id,
				name: text(at(node, "name")),
				runsScheduledWork: flag(at(node, "scheduledTasks")),
				started: text(at(node, "nodeStart")),
				lastHeartbeat: heartbeat(at(node, "lastHeartbeat")),
			}))
		: [];

	const lastRunCount = at(info, "trackingStatus", "lastRunCount");

	return {
		nodes,
		scheduledWorkEnabled: flag(at(info, "dcb", "sheduled-tasks", "enabled")),
		trackingInterval: text(at(info, "tracking", "interval")),
		trackingLastRunCount:
			typeof lastRunCount === "number" ? lastRunCount : null,
		trackingLastRunSeconds: durationSeconds(
			at(info, "trackingStatus", "lastRunDuration"),
		),
		harvestInterval: text(at(info, "harvest", "interval")),
	};
}
