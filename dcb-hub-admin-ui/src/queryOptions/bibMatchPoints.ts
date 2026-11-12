import { queryOptions } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";

import { nonCriticalQuery } from "@helpers/queryPolicy";

export interface BibMatchPoint {
	/** The hash two bibs must share to cluster on this point. */
	value: string;
	domain?: string | null;
	/** The identifier as read from the record, where dcb-service sends it. */
	sourceValueHint?: string | null;
}

/**
 * GET /bibs/{id}/matchpoints (ADMIN, 8.71.0-9.3.0) generates the bib's match points from
 * its record now, rather than reading the stored ones. One bib has tens at most.
 */
export const bibMatchPointsQuery = (
	client: AxiosInstance,
	bibId: string,
	enabled: boolean,
) =>
	queryOptions({
		...nonCriticalQuery,
		queryKey: ["bibMatchPoints", bibId],
		queryFn: async ({ signal }): Promise<BibMatchPoint[]> => {
			const { data } = await client.get<BibMatchPoint[]>(
				`/bibs/${encodeURIComponent(bibId)}/matchpoints`,
				{ signal },
			);
			return [...(data ?? [])].sort((a, b) =>
				(a.domain ?? "").localeCompare(b.domain ?? ""),
			);
		},
		// Changes only when the bib's record does
		staleTime: 5 * 60_000,
		enabled,
	});
