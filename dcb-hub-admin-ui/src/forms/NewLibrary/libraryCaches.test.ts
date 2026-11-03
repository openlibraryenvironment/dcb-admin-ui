import { describe, expect, it } from "vitest";
import { QueryClient } from "@tanstack/react-query";

import { invalidateLibraryCaches } from "./libraryCaches";
import { LIBRARY_COUNT_QUERY_KEY } from "@/queryOptions/setup";

const seeded = (...keys: unknown[][]) => {
	const queryClient = new QueryClient();
	for (const key of keys) queryClient.setQueryData(key, {});
	return queryClient;
};

const isInvalidated = (queryClient: QueryClient, key: unknown[]) =>
	queryClient.getQueryState(key)?.isInvalidated ?? false;

describe("invalidateLibraryCaches", () => {
	it("marks the setup flow's library count stale, so the Libraries chapter sees a new library", async () => {
		const queryClient = seeded(LIBRARY_COUNT_QUERY_KEY);

		await invalidateLibraryCaches(queryClient);

		expect(isInvalidated(queryClient, LIBRARY_COUNT_QUERY_KEY)).toBe(true);
	});

	it("marks every library, agency and list key stale", async () => {
		const keys = [
			["library", "id-1"],
			["libraries", { page: 0 }],
			["librariesList-grid", { page: 0 }],
			["agencies"],
			["agency", "code"],
		];
		const queryClient = seeded(...keys);

		await invalidateLibraryCaches(queryClient);

		for (const key of keys) expect(isInvalidated(queryClient, key)).toBe(true);
	});

	it("leaves unrelated keys alone", async () => {
		const queryClient = seeded(["hostlmss"], ["LoadConsortium"]);

		await invalidateLibraryCaches(queryClient);

		expect(isInvalidated(queryClient, ["hostlmss"])).toBe(false);
		expect(isInvalidated(queryClient, ["LoadConsortium"])).toBe(false);
	});
});
