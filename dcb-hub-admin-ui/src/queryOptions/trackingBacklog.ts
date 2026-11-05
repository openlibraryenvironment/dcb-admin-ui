import { queryOptions } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";

import { nonCriticalQuery } from "@helpers/queryPolicy";

export interface TrackingBacklogRow {
	status: string;
	scheduled: number;
	overdue: number;
}

type NamedSqlResult = {
	hits?: { Status?: string; Total?: string }[];
	error?: string;
};

// GenericSelectService answers 200 even when the SQL fails, and every value is a string
const countsByStatus = async (
	client: AxiosInstance,
	name: "trackingAwaiting" | "trackingNow",
	signal: AbortSignal,
): Promise<Map<string, number>> => {
	const { data } = await client.get<NamedSqlResult>("/sql", {
		params: { name },
		signal,
	});
	if (data?.error || !Array.isArray(data?.hits))
		throw new Error(`Named SQL ${name} failed`);
	return new Map(
		data.hits.map((hit) => [String(hit.Status), Number(hit.Total) || 0]),
	);
};

export const trackingBacklogQuery = (client: AxiosInstance) =>
	queryOptions({
		...nonCriticalQuery,
		queryKey: ["trackingBacklog"],
		queryFn: async ({ signal }): Promise<TrackingBacklogRow[]> => {
			const [scheduled, overdue] = await Promise.all([
				countsByStatus(client, "trackingAwaiting", signal),
				countsByStatus(client, "trackingNow", signal),
			]);
			return [...scheduled.keys()].sort().map((status) => ({
				status,
				scheduled: scheduled.get(status) ?? 0,
				overdue: overdue.get(status) ?? 0,
			}));
		},
		// Each fetch is two sequential scans of patron_request: the poll index is partial on
		// is_too_long, which neither query filters on. Fetched on visit, never on a timer.
		staleTime: 5 * 60_000,
		refetchOnWindowFocus: false,
	});
