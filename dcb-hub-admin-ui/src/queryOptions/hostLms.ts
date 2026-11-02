import { queryOptions } from "@tanstack/react-query";
import { GraphQLClient } from "graphql-request";

import { getHostLmsSelection } from "@queries/getHostLmsSelection";
import type { LoadHostLmsSelectionQueryVariables } from "@generated/graphql";
import { nonCriticalQuery } from "@helpers/queryPolicy";

/**
 * Under "hostlmss", so creating a Host LMS - which invalidates that root - lists it here.
 * Keyed on its own it stayed stale for five minutes, and "Add another library" could not
 * pick the shared system the previous library had just created.
 */
export const hostLmsSelectionQueryKey = ["hostlmss", "selection"] as const;

/** ≤1000 rows: a consortium runs hundreds of Host LMS at most. */
export const hostLmsSelectionQuery = (gqlClient: GraphQLClient) =>
	queryOptions({
		...nonCriticalQuery,
		queryKey: hostLmsSelectionQueryKey,
		queryFn: () =>
			gqlClient.request<any, LoadHostLmsSelectionQueryVariables>(
				getHostLmsSelection,
				{ pagesize: 1000 },
			),
		staleTime: 1000 * 60 * 5,
	});
