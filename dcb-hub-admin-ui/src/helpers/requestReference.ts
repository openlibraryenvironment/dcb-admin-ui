/**
 * A reference sent with every call to dcb-service, which writes it into the log lines that
 * call produces (dcb-service docs/request-id.md). Shown with an error, it is what support
 * quotes to find those lines.
 */
export const REQUEST_ID_HEADER = "X-Request-Id";

/** "adm-" and 12 hex characters, inside dcb-service's 1-64 characters of A-Z a-z 0-9 . _ - */
export function newRequestReference(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(6));
	return `adm-${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

type Fetch = typeof globalThis.fetch;

/**
 * Sends a fresh reference with each call, and copies it onto the response. dcb-service
 * echoes it, but does not expose the header to a page on another origin, so the copy is
 * the only way an error raised from that response can name it.
 */
export function fetchWithRequestReference(
	base: Fetch = (input, init) => globalThis.fetch(input, init),
): Fetch {
	return async (input, init) => {
		const reference = newRequestReference();
		const headers = new Headers(init?.headers);
		headers.set(REQUEST_ID_HEADER, reference);

		let response: Response;
		try {
			response = await base(input, { ...init, headers });
		} catch (error) {
			throw Object.assign(
				error instanceof Error ? error : new Error(String(error)),
				{ requestReference: reference },
			);
		}

		// An opaque response cannot be rebuilt, and carries nothing a page can read anyway
		if (response.type === "opaque" || response.status === 0) return response;

		const carried = new Headers(response.headers);
		carried.set(REQUEST_ID_HEADER, reference);
		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers: carried,
		});
	};
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null;

const headerFrom = (headers: unknown): string | null => {
	if (headers instanceof Headers) return headers.get(REQUEST_ID_HEADER);
	if (isRecord(headers)) {
		if (typeof headers.get === "function") {
			const value: unknown = headers.get(REQUEST_ID_HEADER);
			return typeof value === "string" ? value : null;
		}
		const value = headers[REQUEST_ID_HEADER];
		return typeof value === "string" ? value : null;
	}
	return null;
};

/**
 * The reference a failed call was sent with: from a network failure, a graphql-request
 * ClientError's response, or an axios error's request config. Null when there is none.
 */
export function requestReferenceOf(error: unknown): string | null {
	if (!isRecord(error)) return null;

	if (typeof error.requestReference === "string") return error.requestReference;

	const fromResponse = isRecord(error.response)
		? headerFrom(error.response.headers)
		: null;
	if (fromResponse) return fromResponse;

	return isRecord(error.config) ? headerFrom(error.config.headers) : null;
}
