import { describe, expect, it, vi } from "vitest";
import { GraphQLClient } from "graphql-request";

import {
	fetchLibrary,
	libraryBasicsByAgencyCodeQuery,
	libraryBasicsQuery,
	libraryQuery,
	libraryQueryKey,
} from "@/queryOptions/library";

const client = {} as GraphQLClient;
const asData = (libraries: any[]) => ({ libraries: { content: libraries } });

describe("libraryQuery", () => {
	it("keys on the library id, matching the route loaders' prefetch", () => {
		// The loader prefetches with libraryQueryKey and the component reads with
		// libraryQuery; if these diverged the prefetch would warm a cache entry
		// nothing reads and every page would refetch on mount.
		expect(libraryQuery(client, "uuid-1").queryKey).toEqual(
			libraryQueryKey("uuid-1"),
		);
	});

	it("unwraps to the library itself", () => {
		const select = libraryQuery(client, "uuid-1").select!;
		expect(select(asData([{ id: "uuid-1", fullName: "A" }]))).toEqual({
			id: "uuid-1",
			fullName: "A",
		});
	});

	it("yields undefined rather than throwing when nothing matched", () => {
		const select = libraryQuery(client, "uuid-1").select!;
		expect(select(asData([]))).toBeUndefined();
		expect(select({})).toBeUndefined();
		expect(select(undefined)).toBeUndefined();
	});

	it("does not fire without an id", () => {
		expect(libraryQuery(client, "").enabled).toBe(false);
		expect(libraryQuery(client, "uuid-1").enabled).toBe(true);
	});

	it("looks the library up by id", async () => {
		const request = vi.fn().mockResolvedValue(asData([]));
		await fetchLibrary({ request } as unknown as GraphQLClient, "uuid-1");
		expect(request).toHaveBeenCalledWith(expect.anything(), {
			query: "id:uuid-1",
		});
	});
});

describe("libraryBasicsByAgencyCodeQuery", () => {
	it("scopes the cache key so several lookups can coexist on one page", () => {
		// A patron request resolves a supplying, a pickup and a patron library at
		// once. Without the scope they would share a key and overwrite each other.
		expect(
			libraryBasicsByAgencyCodeQuery(client, "ABC", "supplier").queryKey,
		).not.toEqual(
			libraryBasicsByAgencyCodeQuery(client, "ABC", "pickup").queryKey,
		);
	});

	it("does not fire on an undefined agency code", () => {
		// Firing early cached a miss for "agencyCode:undefined" under a key that
		// never changed again, so the library never resolved.
		expect(
			libraryBasicsByAgencyCodeQuery(client, undefined, "supplier").enabled,
		).toBe(false);
	});

	it("looks the library up by agency code", async () => {
		const request = vi.fn().mockResolvedValue(asData([]));
		await (
			libraryBasicsByAgencyCodeQuery({ request } as any, "ABC", "supplier")
				.queryFn as any
		)();
		expect(request).toHaveBeenCalledWith(expect.anything(), {
			query: "agencyCode:ABC",
		});
	});
});

describe("libraryBasicsQuery", () => {
	it("looks the library up by id and unwraps it", async () => {
		const request = vi.fn().mockResolvedValue(asData([{ id: "uuid-1" }]));
		const options = libraryBasicsQuery(
			{ request } as any,
			"uuid-1",
			"settings",
		);
		await (options.queryFn as any)();
		expect(request).toHaveBeenCalledWith(expect.anything(), {
			query: "id:uuid-1",
		});
		expect(options.select!(asData([{ id: "uuid-1" }]))).toEqual({
			id: "uuid-1",
		});
	});
});
