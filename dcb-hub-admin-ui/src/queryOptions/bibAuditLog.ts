import { queryOptions } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";

import { nonCriticalQuery } from "@helpers/queryPolicy";

export interface BibAuditEntry {
	id: string;
	processType: string;
	message: string;
	timestamp: string;
}

/**
 * GET /bibs/{id}/audit-log answers a map of process type to entries, oldest first. Only
 * the latest run per bib and process is kept, so this is one ingest run's messages.
 */
export const bibAuditLogQuery = (
	client: AxiosInstance,
	bibId: string,
	enabled: boolean,
) =>
	queryOptions({
		...nonCriticalQuery,
		queryKey: ["bibAuditLog", bibId],
		queryFn: async ({ signal }): Promise<BibAuditEntry[]> => {
			const { data } = await client.get<Record<string, BibAuditEntry[]>>(
				`/bibs/${encodeURIComponent(bibId)}/audit-log`,
				{ signal },
			);
			return Object.values(data ?? {})
				.flat()
				.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
		},
		// Rewritten only when the bib is next ingested
		staleTime: 5 * 60_000,
		enabled,
	});
