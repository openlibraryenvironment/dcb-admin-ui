import { queryOptions } from "@tanstack/react-query";
import { GraphQLClient } from "graphql-request";

import { getRequestTags } from "@queries/getRequestTags";
import type { LoadRequestTagsQuery } from "@generated/graphql";

export const REQUEST_TAGS_QUERY_KEY = ["requestTags"] as const;

export const requestTagsQuery = (gqlClient: GraphQLClient) =>
	queryOptions({
		queryKey: REQUEST_TAGS_QUERY_KEY,
		// Every change made on the page invalidates this key, so a shorter window would only
		// refetch an unchanged list each time the tab is remounted.
		staleTime: 60 * 1000,
		queryFn: () => gqlClient.request<LoadRequestTagsQuery>(getRequestTags),
	});
