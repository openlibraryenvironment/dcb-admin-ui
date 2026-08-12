// Mirror of CreateHostLmsDataFetcher.CreateHostLmsResult (dcb-service). The
// status fields are human-readable diagnostic strings the backend builds, e.g.
// "Status: OK", "Ping Failed: ...", "Success: Retrieved chunk with N records.",
// "Skipped: ...", "Ingest Check Failed: ...".
export type HostLmsVerificationResult = {
	hostLms?: { code?: string | null; name?: string | null } | null;
	pingStatus?: string | null;
	ingestStatus?: string | null;
	warnings?: (string | null)[] | null;
};

export type VerificationSeverity = "success" | "error" | "info";

// The backend prefixes every diagnostic string with an outcome token, so we can
// classify severity without the LMS-specific detail leaking into this layer.
export const classifyVerificationStatus = (
	status?: string | null,
): VerificationSeverity => {
	if (!status) return "info";
	const lower = status.toLowerCase();
	if (lower.includes("failed")) return "error";
	if (lower.startsWith("skipped")) return "info";
	return "success";
};

/**
 * dcb-service caps the ingest probe at 20 seconds
 * (`CreateHostLmsDataFetcher.performVerification`) and reports the resulting
 * Reactor TimeoutException as an ordinary "Ingest Check Failed". For a large
 * catalogue the first chunk routinely takes longer than that and then arrives -
 * so the check failed but the ingest itself usually did not. It stays an error,
 * because nothing here has confirmed it worked, but the user is told where to
 * go and look rather than left to conclude the Host LMS is broken.
 */
export const isIngestTimeout = (status?: string | null): boolean => {
	if (!status) return false;
	const lower = status.toLowerCase();
	return (
		lower.includes("timeout") ||
		lower.includes("timed out") ||
		lower.includes("did not observe any item")
	);
};
