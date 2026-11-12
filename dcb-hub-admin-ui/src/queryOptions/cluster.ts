import { queryOptions } from "@tanstack/react-query";
import { GraphQLClient } from "graphql-request";

import { getClusters } from "@queries/getClusters";
import type { ClusterRecordsQueryVariables } from "@generated/graphql";

export const clusterKeys = {
	full: (clusterId: string) => ["cluster", "full", clusterId] as const,
};

/** A cluster with its member bibs, shared by the cluster, identifiers and explanation tabs. */
export const clusterFullQuery = (gqlClient: GraphQLClient, clusterId: string) =>
	queryOptions({
		queryKey: clusterKeys.full(clusterId),
		queryFn: () =>
			gqlClient.request<any, ClusterRecordsQueryVariables>(getClusters, {
				query: `id: ${clusterId}`,
			}),
		enabled: !!clusterId,
	});
