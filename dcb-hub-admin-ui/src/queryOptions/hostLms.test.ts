import { describe, expect, it } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { GraphQLClient } from "graphql-request";

import { hostLmsSelectionQuery } from "@/queryOptions/hostLms";

describe("hostLmsSelectionQuery", () => {
	// What NewLibrary and the Host LMS page invalidate after a create
	it("is made stale by invalidating the hostlmss root", async () => {
		const queryClient = new QueryClient();
		const { queryKey } = hostLmsSelectionQuery({} as GraphQLClient);
		queryClient.setQueryData(queryKey, { hostLms: { content: [] } });

		await queryClient.invalidateQueries({
			queryKey: ["hostlmss"],
			refetchType: "none",
		});

		expect(queryClient.getQueryState(queryKey)?.isInvalidated).toBe(true);
	});
});
