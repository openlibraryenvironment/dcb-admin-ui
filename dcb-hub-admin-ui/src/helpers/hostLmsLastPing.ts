/**
 * What dcb-service recorded at its last connectivity check of a Host LMS, read from the
 * `lastPing` JSON on HostLms. `failure` is set only when `status` is ERROR.
 */
export type HostLmsLastPingState =
	"ok" | "refused" | "misconfigured" | "unreachable" | "failing" | "unknown";

export type HostLmsLastPingSeverity = "success" | "warning" | "error";

export interface HostLmsLastPingView {
	state: HostLmsLastPingState;
	severity: HostLmsLastPingSeverity;
	checkedAt: string | null;
	lastOkAt: string | null;
	versionInfo: string | null;
	pingMillis: number | null;
}

const FAILURES: Record<string, HostLmsLastPingState> = {
	REFUSED: "refused",
	MISCONFIGURED: "misconfigured",
	UNREACHABLE: "unreachable",
	FAILING: "failing",
};

// REFUSED and MISCONFIGURED are what the supplier preflight rules a library out on
const SEVERITY: Record<HostLmsLastPingState, HostLmsLastPingSeverity> = {
	ok: "success",
	refused: "error",
	misconfigured: "error",
	unreachable: "warning",
	failing: "warning",
	unknown: "warning",
};

const text = (value: unknown): string | null =>
	typeof value === "string" && value !== "" ? value : null;

/** Null when the Host LMS has never been checked, or the field was not selected. */
export function lastPingView(lastPing: unknown): HostLmsLastPingView | null {
	if (lastPing == null || typeof lastPing !== "object") return null;

	const record = lastPing as Record<string, unknown>;
	if (record.status == null) return null;

	const state: HostLmsLastPingState =
		record.status === "OK"
			? "ok"
			: (FAILURES[String(record.failure)] ?? "unknown");

	return {
		state,
		severity: SEVERITY[state],
		checkedAt: text(record.checkedAt),
		lastOkAt: text(record.lastOkAt),
		versionInfo: text(record.versionInfo),
		pingMillis:
			typeof record.pingMillis === "number" ? record.pingMillis : null,
	};
}
