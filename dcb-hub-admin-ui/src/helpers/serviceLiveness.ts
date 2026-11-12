/**
 * Whether dcb-service itself is answering, asked once however many requests failed
 * together. A 503 or a network failure on one request may be a member library's system
 * passed through, or one route refused by a proxy; only a failed liveness check means
 * the whole service is down. Liveness rather than /health, which answers 503 whenever any
 * one of its indicators is down.
 */
export const serviceLivenessCheck = (probe: () => Promise<unknown>) => {
	let inFlight: Promise<boolean> | null = null;
	return (): Promise<boolean> => {
		inFlight ??= probe()
			.then(
				() => true,
				() => false,
			)
			.finally(() => {
				inFlight = null;
			});
		return inFlight;
	};
};
