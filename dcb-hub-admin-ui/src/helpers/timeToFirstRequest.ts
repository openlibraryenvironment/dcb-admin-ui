/** When a library was created, and when it first borrowed or supplied, as ISO strings. */
export interface FirstRequestTimes {
	createdAt?: string | null;
	firstRequestAt?: string | null;
}

export interface TimeToFirstRequest {
	/** Null when no library has both dates. */
	medianDays: number | null;
	/** Libraries with both dates, the first request on or after creation. */
	measured: number;
	/** Libraries with a creation date and no request yet. */
	waiting: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** The earlier of two ISO timestamps, ignoring missing ones. */
export const earliest = (
	...timestamps: (string | null | undefined)[]
): string | null =>
	timestamps
		.filter((timestamp): timestamp is string => !!timestamp)
		.reduce<string | null>(
			(first, timestamp) =>
				first === null || Date.parse(timestamp) < Date.parse(first)
					? timestamp
					: first,
			null,
		);

/**
 * The consortium's median time from a library being created to its first request.
 *
 * A request dated before the library was created comes from a library record made after
 * the fact, so it says nothing about setup time and is left out.
 */
export const timeToFirstRequest = (
	libraries: FirstRequestTimes[],
): TimeToFirstRequest => {
	const days: number[] = [];
	let waiting = 0;

	for (const { createdAt, firstRequestAt } of libraries) {
		if (!createdAt) continue;
		if (!firstRequestAt) {
			waiting += 1;
			continue;
		}
		const elapsed = Date.parse(firstRequestAt) - Date.parse(createdAt);
		if (elapsed >= 0) days.push(elapsed / DAY_MS);
	}

	days.sort((a, b) => a - b);
	const middle = Math.floor(days.length / 2);
	const median =
		days.length === 0
			? null
			: days.length % 2
				? days[middle]
				: (days[middle - 1] + days[middle]) / 2;

	return {
		medianDays: median === null ? null : Math.round(median * 10) / 10,
		measured: days.length,
		waiting,
	};
};
