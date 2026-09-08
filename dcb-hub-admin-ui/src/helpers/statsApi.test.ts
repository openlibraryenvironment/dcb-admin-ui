import { describe, expect, it, vi } from "vitest";
import type { AxiosInstance } from "axios";

import * as statsApi from "@helpers/statsApi";
import {
	LIBRARY_CODE_PARAM,
	clusterSizeDistributionQueryOptions,
	collectionProfileQueryOptions,
	collectionTotalsQueryOptions,
	dashboardMetricsQueryOptions,
	formatProfileQueryOptions,
	peerBenchmarksQueryOptions,
	timeSeriesQueryOptions,
	topPartnersQueryOptions,
	turnaroundQueryOptions,
} from "@helpers/statsApi";

/**
 * Two wire-format facts about the Insights API, neither of which any other test can catch.
 *
 * 1. The surface moved to /insights. LegacyStatsController still answers /top-requestors and
 *    /top-requested-titles and nothing else, so a call left on the old base is a 404 for
 *    every other endpoint - and the Insights pages are flag-gated, so nobody would find out
 *    until the flag was turned on in an environment.
 *
 * 2. The library filter goes as `requestedLibraryCode`, never `libraryCode`. StatsScopeGuard
 *    treats it as a REQUEST checked against the caller's token rather than an instruction.
 *    Sending the old name is silently wrong rather than an error: the endpoint ignores it,
 *    and a library-scoped caller still gets the right answer because the guard falls back to
 *    their token. A CONSORTIUM administrator asking for one library does not - they get
 *    consortium-wide figures rendered under that library's name.
 */
describe("statsApi wire contract", () => {
	const recordingClient = (
		body: unknown = [],
	): {
		client: AxiosInstance;
		url: () => string;
		params: () => Record<string, unknown> | undefined;
	} => {
		let capturedUrl = "";
		let capturedParams: Record<string, unknown> | undefined;

		const get = vi.fn(
			async (url: string, config?: { params?: Record<string, unknown> }) => {
				capturedUrl = url;
				capturedParams = config?.params;
				return { data: body };
			},
		);

		return {
			client: { get } as unknown as AxiosInstance,
			url: () => capturedUrl,
			params: () => capturedParams,
		};
	};

	// Every factory that takes only (client, params), called through one code path so a new
	// endpoint added on the old base is caught without anybody remembering to list it here.
	const uniformFactories = Object.entries(statsApi).filter(
		([name, value]) =>
			name.endsWith("QueryOptions") &&
			typeof value === "function" &&
			(value as (...a: unknown[]) => unknown).length === 2,
	) as [string, (c: AxiosInstance, p: object) => { queryFn: () => unknown }][];

	it("has factories to check", () => {
		// Guards the filter above: a rename that made it match nothing would leave the sweep
		// below asserting over an empty list and passing vacuously.
		expect(uniformFactories.length).toBeGreaterThan(15);
	});

	it.each(uniformFactories)(
		"calls %s under /insights",
		async (_name, factory) => {
			const { client, url } = recordingClient();

			await factory(client, {
				libraryCode: "LIB_A",
				acquiredSince: "2026-01-01T00:00:00Z",
			}).queryFn();

			expect(url()).toMatch(/^\/insights\//);
			expect(url()).not.toContain("/patrons/requests/stats");
		},
	);

	it("calls the endpoints that take a third argument under /insights too", async () => {
		const { client, url } = recordingClient();

		await timeSeriesQueryOptions(client, {}, "day").queryFn();

		expect(url()).toBe("/insights/timeseries");
	});

	it("sends the library filter under the name dcb-service binds", async () => {
		const { client, params } = recordingClient();

		await dashboardMetricsQueryOptions(client, {
			libraryCode: "LIB_A",
		}).queryFn();

		expect(params()).toEqual({ [LIBRARY_CODE_PARAM]: "LIB_A" });
		expect(params()).not.toHaveProperty("libraryCode");
	});

	it("leaves libraryCodes alone - /turnaround binds that name itself", async () => {
		const { client, params } = recordingClient({
			p50Seconds: 1,
			p95Seconds: 2,
		});

		await turnaroundQueryOptions(client, {
			libraryCodes: "LIB_A,LIB_B",
			targetStatus: "LOANED",
		}).queryFn();

		expect(params()).toEqual({
			libraryCodes: "LIB_A,LIB_B",
			targetStatus: "LOANED",
		});
	});

	it("sends no library filter to peer-benchmarks, which takes none", async () => {
		const { client, params } = recordingClient();

		await peerBenchmarksQueryOptions(client, {
			startDate: "2026-01-01T00:00:00Z",
		}).queryFn();

		expect(params()).toEqual({ startDate: "2026-01-01T00:00:00Z" });
	});

	it("still drops undefined rather than serialising it", async () => {
		const { client, params } = recordingClient();

		await dashboardMetricsQueryOptions(client, {
			libraryCode: "LIB_A",
			startDate: undefined,
		}).queryFn();

		expect(params()).toEqual({ [LIBRARY_CODE_PARAM]: "LIB_A" });
	});

	describe("top-partners", () => {
		it("passes paging through untouched", async () => {
			const { client, params } = recordingClient({ content: [], totalSize: 0 });

			await topPartnersQueryOptions(client, {
				libraryCode: "LIB_A",
				page: 2,
				size: 25,
			}).queryFn();

			expect(params()).toEqual({
				[LIBRARY_CODE_PARAM]: "LIB_A",
				page: 2,
				size: 25,
			});
		});

		it("surfaces the page rather than flattening it to the first page", async () => {
			// The tail being reachable is the reason this endpoint exists over the fixed top
			// ten on dashboard-metrics; a helper that returned page zero would put it back
			// out of reach. totalSize counts PARTNERS, so it drives a page control directly.
			const { client } = recordingClient({
				content: [{ partnerCode: "PEER_X" }],
				totalSize: 37,
			});

			const page = await topPartnersQueryOptions(client, {
				libraryCode: "LIB_A",
			}).queryFn();

			expect(page.totalSize).toBe(37);
			expect(page.content).toHaveLength(1);
		});
	});

	describe("collection analysis", () => {
		// Four consortium-wide catalogue aggregates. Each is a pass over bib_record, which
		// dcb-service serves one at a time behind a 15-minute cache, so what this client
		// must not do is ask often or retry on refusal.
		const consortiumWide = [
			["collection-totals", collectionTotalsQueryOptions],
			["collection-profile", collectionProfileQueryOptions],
			["cluster-size-distribution", clusterSizeDistributionQueryOptions],
			["format-profile", formatProfileQueryOptions],
		] as const;

		it.each(consortiumWide)(
			"calls /insights/%s with no parameters",
			async (path, factory) => {
				const { client, url, params } = recordingClient();

				await factory(client).queryFn();

				expect(url()).toBe(`/insights/${path}`);
				// No date window: these count works held, not requests made. Sending the range
				// would imply the numbers move with it.
				expect(params()).toBeUndefined();
			},
		);

		it.each(consortiumWide)(
			"gives %s a constant key, so the range picker cannot refetch it",
			(path, factory) => {
				const { client } = recordingClient();

				// Exactly this, and nothing window-dependent: a key carrying the range
				// would evict on every preset change and re-run a 20M-row aggregate that
				// would return the same numbers.
				expect(factory(client).queryKey).toEqual(["stats", path]);
			},
		);

		it.each(consortiumWide)(
			"does not retry %s on refusal",
			(_path, factory) => {
				const { client } = recordingClient();

				// A 429 means the one permit is taken. Retrying spends the next caller's
				// budget too, so the panel offers a manual retry instead.
				expect(factory(client).retry).toBe(false);
				expect(factory(client).staleTime).toBe(15 * 60 * 1000);
			},
		);
	});
});
