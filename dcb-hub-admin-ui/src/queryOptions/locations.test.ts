import { describe, expect, it, vi } from "vitest";
import { GraphQLClient } from "graphql-request";

import { allLocationsQuery, fetchAllLocations } from "@/queryOptions/locations";

/** A client that serves `total` locations 100 at a time, and counts requests. */
const pagingClient = (total: number) => {
	const request = vi.fn(async (_document: unknown, variables: any) => {
		const start = variables.pageno * variables.pagesize;
		const content = Array.from(
			{ length: Math.max(0, Math.min(variables.pagesize, total - start)) },
			(_, index) => ({ id: `loc-${start + index}` }),
		);
		return { locations: { content, totalSize: total } };
	});
	return { client: { request } as unknown as GraphQLClient, request };
};

describe("fetchAllLocations", () => {
	it("returns a flat array, not the raw paged response", () => {
		// The two implementations this replaced disagreed about the shape; every
		// consumer wanted the array.
		return expect(fetchAllLocations(pagingClient(3).client)).resolves.toEqual([
			{ id: "loc-0" },
			{ id: "loc-1" },
			{ id: "loc-2" },
		]);
	});

	it("makes a single request when everything fits on one page", async () => {
		const { client, request } = pagingClient(42);
		await fetchAllLocations(client);
		expect(request).toHaveBeenCalledTimes(1);
	});

	it("pages through the whole set rather than truncating", async () => {
		// The single-shot `pagesize: 1000` version silently dropped everything
		// past the first thousand, and the only symptom was a pickup location
		// rendering as a bare UUID.
		const { client, request } = pagingClient(1250);
		const locations = await fetchAllLocations(client);
		expect(locations).toHaveLength(1250);
		expect(request).toHaveBeenCalledTimes(13);
	});

	it("asks for pages in order from zero with no gaps", async () => {
		const { client, request } = pagingClient(250);
		await fetchAllLocations(client);
		const pages = request.mock.calls.map(([, variables]) => variables.pageno);
		expect(pages).toEqual([0, 1, 2]);
	});

	it("returns the first page when totalSize is missing", async () => {
		const request = vi.fn().mockResolvedValue({
			locations: { content: [{ id: "only" }] },
		});
		await expect(
			fetchAllLocations({ request } as unknown as GraphQLClient),
		).resolves.toEqual([{ id: "only" }]);
		expect(request).toHaveBeenCalledTimes(1);
	});

	it("returns an empty array for an empty response", async () => {
		const request = vi.fn().mockResolvedValue({});
		await expect(
			fetchAllLocations({ request } as unknown as GraphQLClient),
		).resolves.toEqual([]);
	});

	it("orders by name ascending, unfiltered", async () => {
		const { client, request } = pagingClient(1);
		await fetchAllLocations(client);
		expect(request).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({ query: "", order: "name", orderBy: "ASC" }),
		);
	});
});

describe("allLocationsQuery", () => {
	it("uses one cache key for every grid", () => {
		expect(allLocationsQuery({} as GraphQLClient).queryKey).toEqual([
			"locations",
			"all",
		]);
	});
});
