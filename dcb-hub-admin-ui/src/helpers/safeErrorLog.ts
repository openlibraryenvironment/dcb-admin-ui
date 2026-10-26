/**
 * What may be written to the console about a failed request: the method, the path and the
 * status, and nothing else. An AxiosError's `config.data` is the request body, which for a
 * patron lookup holds the barcode. docs/query-error-policy.md, "What a failed request may
 * log".
 */
export function requestErrorSummary(error: unknown): string {
	if (typeof error !== "object" || error === null) {
		return "request failed (no detail)";
	}

	const candidate = error as {
		message?: unknown;
		code?: unknown;
		config?: { method?: unknown; url?: unknown };
		response?: { status?: unknown; statusText?: unknown };
	};

	const method =
		typeof candidate.config?.method === "string"
			? candidate.config.method.toUpperCase()
			: "";

	// The path only. A query string is the other place an identifier ends up, and
	// nothing here needs one to be diagnosable.
	let path = "";
	if (typeof candidate.config?.url === "string") {
		const [withoutQuery] = candidate.config.url.split("?");
		path = withoutQuery;
	}

	const status =
		typeof candidate.response?.status === "number"
			? String(candidate.response.status)
			: "";
	const statusText =
		typeof candidate.response?.statusText === "string"
			? candidate.response.statusText
			: "";

	// No response: a network failure or a timeout, where axios' own code is the fact
	// worth having. `message` is only used in that case, and only from an Error - an
	// axios message is "Request failed with status code 401", which carries nothing
	// that was sent.
	const outcome =
		status || statusText
			? [status, statusText].filter(Boolean).join(" ")
			: typeof candidate.code === "string"
				? candidate.code
				: error instanceof Error
					? error.message
					: "no response";

	const where = [method, path].filter(Boolean).join(" ");
	return where ? `${where} -> ${outcome}` : `request failed: ${outcome}`;
}

const isRequestError = (error: unknown): boolean =>
	typeof error === "object" &&
	error !== null &&
	("config" in error || "response" in error || "request" in error);

/**
 * What may be logged about anything thrown. A failed request is its summary: an AxiosError
 * carries the bearer token in `config.headers` and a GraphQL ClientError the variables.
 * Anything else is its stack, which a crash needs.
 */
export function errorForLog(error: unknown): string {
	if (isRequestError(error)) return requestErrorSummary(error);
	if (error instanceof Error)
		return error.stack ?? `${error.name}: ${error.message}`;
	return String(error);
}

/** What a page may show about anything thrown: a ClientError's message embeds the request's variables. */
export function errorForDisplay(error: unknown): string {
	if (isRequestError(error)) return requestErrorSummary(error);
	if (error instanceof Error) return error.message;
	return String(error);
}
