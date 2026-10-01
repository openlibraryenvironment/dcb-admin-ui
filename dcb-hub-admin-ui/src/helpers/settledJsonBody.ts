/**
 * A settled request's JSON body, or null when what came back was not a JSON object.
 *
 * An array is rejected as well as a string: every payload this narrows is an object, and
 * a JSON array where one is expected is the same class of wrong answer.
 */
export function settledJsonBody<T>(
	settled: PromiseSettledResult<{ data: unknown }>,
): T | null {
	if (settled.status !== "fulfilled") return null;
	const body = settled.value?.data;
	if (typeof body !== "object" || body === null || Array.isArray(body)) {
		return null;
	}
	return body as T;
}
