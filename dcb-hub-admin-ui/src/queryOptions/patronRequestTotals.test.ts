import { describe, expect, it, vi } from "vitest";
import { GraphQLClient } from "graphql-request";

import {
	PATRON_REQUEST_BUCKETS,
	patronRequestTotalQuery,
} from "@/queryOptions/patronRequestTotals";
import { queries } from "@constants/patronRequestGridQueries";

const client = {} as GraphQLClient;

describe("patronRequestTotalQuery", () => {
	it("gives each bucket its own cache entry", () => {
		const keys = PATRON_REQUEST_BUCKETS.map((bucket) =>
			JSON.stringify(patronRequestTotalQuery(client, bucket).queryKey),
		);
		expect(new Set(keys).size).toBe(PATRON_REQUEST_BUCKETS.length);
	});

	it("keeps every bucket under the patronRequest invalidation prefix", () => {
		// invalidatePatronRequestQueries sweeps on this prefix, which is what
		// refreshes the tab counts after a status-changing action.
		for (const bucket of PATRON_REQUEST_BUCKETS) {
			const root = patronRequestTotalQuery(client, bucket).queryKey[0];
			expect(String(root).startsWith("patronRequest")).toBe(true);
		}
	});

	it("sends the bucket's own filter", async () => {
		for (const bucket of PATRON_REQUEST_BUCKETS) {
			const request = vi.fn().mockResolvedValue({});
			await (
				patronRequestTotalQuery({ request } as any, bucket).queryFn as any
			)();
			expect(request).toHaveBeenCalledWith(
				expect.anything(),
				expect.objectContaining({ query: queries[bucket] }),
			);
		}
	});

	it("asks for one row, because only the count is wanted", async () => {
		const request = vi.fn().mockResolvedValue({});
		await (
			patronRequestTotalQuery({ request } as any, "exception").queryFn as any
		)();
		expect(request).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({ pagesize: 1, pageno: 0 }),
		);
	});

	it("selects the count itself", () => {
		const select = patronRequestTotalQuery(client, "exception").select!;
		expect(select({ patronRequests: { totalSize: 7 } })).toBe(7);
	});

	it("counts an absent or empty response as zero, never undefined", () => {
		// The tab bar adds these together; undefined would render "NaN".
		const select = patronRequestTotalQuery(client, "finished").select!;
		expect(select(undefined)).toBe(0);
		expect(select({})).toBe(0);
		expect(select({ patronRequests: {} })).toBe(0);
	});
});
