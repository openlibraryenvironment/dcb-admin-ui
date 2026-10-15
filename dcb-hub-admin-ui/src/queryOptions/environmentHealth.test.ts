import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";

import {
	ENVIRONMENT_REQUEST_TIMEOUT_MS,
	environmentHealthQuery,
	fetchEnvironmentHealth,
} from "@/queryOptions/environmentHealth";

vi.mock("axios", () => ({ default: { get: vi.fn() } }));

const get = axios.get as unknown as ReturnType<typeof vi.fn>;

type Config = { timeout?: number; signal?: AbortSignal };

// A server that never answers: only the request's own timeout or abort ends it, the way
// axios ends a real one
const stalled = (_url: string, config?: Config) =>
	new Promise((_, reject) => {
		const canceled = () =>
			reject(Object.assign(new Error("canceled"), { code: "ERR_CANCELED" }));
		if (config?.signal?.aborted) return canceled();
		if (config?.timeout)
			setTimeout(
				() =>
					reject(Object.assign(new Error("timeout"), { code: "ECONNABORTED" })),
				config.timeout,
			);
		config?.signal?.addEventListener("abort", canceled);
	});

const settledFlag = (promise: Promise<unknown>) => {
	const state = { settled: false };
	promise.then(
		() => (state.settled = true),
		() => (state.settled = true),
	);
	return state;
};

describe("fetchEnvironmentHealth", () => {
	beforeEach(() => {
		get.mockReset();
		vi.useFakeTimers();
	});
	afterEach(() => vi.useRealTimers());

	it("settles when no endpoint ever answers, instead of loading for good", async () => {
		get.mockImplementation(stalled);
		const state = settledFlag(
			fetchEnvironmentHealth("token", new AbortController().signal),
		);

		// The health check times out, then its liveness fallback does
		await vi.advanceTimersByTimeAsync(2 * ENVIRONMENT_REQUEST_TIMEOUT_MS);

		expect(state.settled).toBe(true);
	});

	it("reports every service as unreachable once it has settled", async () => {
		get.mockImplementation(stalled);
		const result = fetchEnvironmentHealth(
			"token",
			new AbortController().signal,
		);
		await vi.advanceTimersByTimeAsync(2 * ENVIRONMENT_REQUEST_TIMEOUT_MS);

		await expect(result).resolves.toMatchObject({
			serviceInfoReached: false,
			serviceInfo: null,
			dcbHealth: { status: "Undefined" },
			trackingConfig: null,
		});
	});

	it("stops at once when the page is left", async () => {
		get.mockImplementation(stalled);
		const leaving = new AbortController();
		const state = settledFlag(fetchEnvironmentHealth("token", leaving.signal));

		leaving.abort();
		await vi.advanceTimersByTimeAsync(0);

		expect(state.settled).toBe(true);
	});

	it("reads a healthy deployment", async () => {
		get.mockImplementation(async (url: string) => {
			if (url.endsWith("/info"))
				return { data: { env: { description: "Test" } } };
			if (url.endsWith("/admin/trackingConfiguration"))
				return {
					data: {
						trackingIntervals: {},
						globalActiveRequestLimit: 5,
						globalTrackingInterval: "PT1H",
					},
				};
			if (url.endsWith("/health")) return { data: {} };
			throw new Error(`unexpected ${url}`);
		});

		const result = await fetchEnvironmentHealth(
			"token",
			new AbortController().signal,
		);

		expect(result.serviceInfoReached).toBe(true);
		expect(result.serviceInfo).toEqual({ env: { description: "Test" } });
		expect(result.trackingConfig?.globalActiveRequestLimit).toBe(5);
	});
});

describe("environmentHealthQuery", () => {
	it("does not fire before there is a token", () => {
		expect(environmentHealthQuery(undefined).enabled).toBe(false);
		expect(environmentHealthQuery("token").enabled).toBe(true);
	});
});
