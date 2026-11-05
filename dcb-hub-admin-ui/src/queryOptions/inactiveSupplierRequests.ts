import { queryOptions } from "@tanstack/react-query";
import type { GraphQLClient } from "graphql-request";

import { getInactiveSupplierRequests } from "@queries/getInactiveSupplierRequests";
import type {
	LoadInactiveSupplierRequestsQuery,
	LoadInactiveSupplierRequestsQueryVariables,
} from "@generated/graphql";
import { nonCriticalQuery } from "@helpers/queryPolicy";

/**
 * The most recent suppliers a request was moved off. A request is re-resolved a handful
 * of times at most; this is a cap, not a page size anyone will page through.
 */
export const PREVIOUS_SUPPLIERS_SHOWN = 25;

export const inactiveSupplierRequestsQuery = (
	gqlClient: GraphQLClient,
	patronRequestId: string,
) =>
	queryOptions({
		...nonCriticalQuery,
		// Under "patronRequest", so invalidatePatronRequestQueries refreshes it after a skip
		queryKey: ["patronRequestInactiveSuppliers", patronRequestId],
		queryFn: () =>
			gqlClient.request<
				LoadInactiveSupplierRequestsQuery,
				LoadInactiveSupplierRequestsQueryVariables
			>(getInactiveSupplierRequests, {
				// patronRequest.id: is not a property path to this fetcher, and fails
				query: `patronRequest:"${patronRequestId}"`,
				pagesize: PREVIOUS_SUPPLIERS_SHOWN,
				order: "dateCreated",
				orderBy: "DESC",
			}),
		// Rows only appear when a supplier is moved off, which a refetch of the request reports
		staleTime: 60_000,
	});
