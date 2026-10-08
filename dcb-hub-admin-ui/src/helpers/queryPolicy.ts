/** A 4xx: the same request will fail the same way next time. */
export function isClientError(error: unknown): boolean {
	const status =
		typeof error === "object" && error !== null
			? (error as { response?: { status?: number } }).response?.status
			: undefined;
	return status !== undefined && status >= 400 && status < 500;
}

/**
 * For a query whose data is not what the route is for.
 *
 * Without it, the client's default sends any non-401/503 failure to the route error
 * boundary, so one failed request for a label or a dropdown's options replaces the whole
 * page. 401 and 503 still reach the component. docs/query-error-policy.md.
 */
export const nonCriticalQuery = { throwOnError: false as const };

/**
 * For a request that fans out to member library systems.
 *
 * One GET /items/availability becomes one request per Host LMS to third-party systems we
 * do not own, so the client's default `retry: 1` doubles that fan-out for a 400 or a 404
 * that cannot succeed on a second attempt. Same attempt budget as the default for a 5xx
 * or a network failure; one attempt for a 4xx. docs/query-error-policy.md.
 */
export const lmsFanOutQuery = {
	retry: (failureCount: number, error: unknown) =>
		failureCount < 1 && !isClientError(error),
};
