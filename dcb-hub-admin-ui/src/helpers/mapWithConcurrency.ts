/**
 * `Promise.all(items.map(...))` with a ceiling on how many run at once.
 *
 * The onboarding page fans out seven or eight count queries per library. Over
 * a 500-library consortium that is four thousand requests handed to the browser
 * in one tick: the connection pool serialises them anyway, the tab holds four
 * thousand pending promises while it does, and dcb-service sees the whole
 * consortium arrive as a burst. Bounding it costs nothing in wall-clock time -
 * the transport was the limit, not the scheduler - and stops the page and the
 * server both being flooded.
 *
 * Order of results matches order of input, as `Promise.all` would.
 */
export const mapWithConcurrency = async <T, R>(
	items: readonly T[],
	limit: number,
	worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> => {
	if (items.length === 0) return [];

	const results = new Array<R>(items.length);
	let nextIndex = 0;

	const runners = Array.from(
		{ length: Math.max(1, Math.min(limit, items.length)) },
		async () => {
			// Each runner pulls the next unclaimed index rather than owning a
			// pre-sliced chunk, so one slow library cannot idle a whole lane.
			while (nextIndex < items.length) {
				const index = nextIndex++;
				results[index] = await worker(items[index], index);
			}
		},
	);

	await Promise.all(runners);
	return results;
};
