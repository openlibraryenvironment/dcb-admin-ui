import { queryOptions } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";

import { lmsFanOutQuery } from "@helpers/queryPolicy";
import type { Item } from "@models/Item";

/** "offered": what a patron can be offered. "unfiltered": every item held, offered or not. */
export type ClusterItemsScope = "offered" | "unfiltered";

export const clusterItemsKeys = {
	scope: (clusterId: string, scope: ClusterItemsScope) =>
		["clusterItems", clusterId, scope] as const,
};

export interface ClusterAvailability {
	itemList: Item[];
	errors: { message?: string | null }[];
}

/**
 * Live availability: dcb-service turns one call into one request per Host LMS, systems we
 * do not own. `signal`, so leaving the page stops the fan-out rather than letting it finish.
 */
export const clusterItemsQuery = (
	client: AxiosInstance,
	clusterId: string,
	scope: ClusterItemsScope,
) =>
	queryOptions({
		...lmsFanOutQuery,
		queryKey: clusterItemsKeys.scope(clusterId, scope),
		queryFn: async ({ signal }): Promise<ClusterAvailability> => {
			const response = await client.get("/items/availability", {
				params:
					scope === "unfiltered"
						? { clusteredBibId: clusterId, filters: "none" }
						: { clusteredBibId: clusterId },
				signal,
			});
			return {
				itemList: response.data?.itemList ?? [],
				errors: response.data?.errors ?? [],
			};
		},
	});
