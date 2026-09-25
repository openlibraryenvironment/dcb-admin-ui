/** The app-wide default (application.tsx), and the ceiling this never exceeds. */
export const DEFAULT_STALE_MS = 1000 * 60 * 5;

/**
 * The shortest window we will hold, however soon the next poll is due.
 *
 * REQUEST_PLACED_AT_SUPPLYING_AGENCY is polled every second, which would otherwise
 * compute to a staleTime of zero and refetch on every mount and every window focus.
 */
export const MIN_STALE_MS = 1000 * 10;

/**
 * How long this request's data can be trusted, from dcb-service's own schedule.
 *
 * `nextScheduledPoll` is `now + dcb.polling.durations[status]` - the earliest moment
 * automatic tracking can change the request. Those durations run from 1s to 6h and are
 * absent for a status nothing polls, so one constant is wrong for nearly every request;
 * they are also per-deployment config, hence reading the server's answer over copying its
 * table. Absent or unreadable keeps the default rather than Infinity, because another
 * operator's clean up or rollback still moves a request nothing polls.
 */
export const staleTimeFromNextPoll = (
	nextScheduledPoll: string | null | undefined,
	now: number = Date.now(),
): number => {
	if (!nextScheduledPoll) return DEFAULT_STALE_MS;

	const due = Date.parse(nextScheduledPoll);
	if (Number.isNaN(due)) return DEFAULT_STALE_MS;

	return Math.min(DEFAULT_STALE_MS, Math.max(MIN_STALE_MS, due - now));
};
