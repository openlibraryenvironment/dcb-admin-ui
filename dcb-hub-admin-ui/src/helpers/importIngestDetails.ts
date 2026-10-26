import { AxiosInstance } from "axios";

import { ProcessState } from "@models/ProcessState";

/** Mirrors HostLmsService.importIngestDetailsFor in dcb-service. */
export interface ImportIngestDetails {
	id: string;
	name: string;
	ingestEnabled?: boolean;
	checkPointId?: string;
	checkPoint?: Record<string, unknown>;
	sourceRecordCount?: number;
	bibRecordCount?: number;
	processStates?: ProcessState[];
	errors?: string[];
	// Absent from a dcb-service that predates it.
	countedAt?: string;
}

export const importIngestDetailsKeys = {
	all: ["importIngestDetails"] as const,
	list: () => [...importIngestDetailsKeys.all, "list"] as const,
	scoped: (hostLmsCodes: string[]) =>
		[...importIngestDetailsKeys.all, "scoped", hostLmsCodes] as const,
	detail: (hostLmsId: string) =>
		[...importIngestDetailsKeys.all, "detail", hostLmsId] as const,
};

// dcb-service shares one count of every Host LMS for five minutes, so asking sooner
// returns the same numbers. No retry: a retry joins the count already running.
// throwOnError is off because both pages say what failed - a timeout on the list, an
// unknown Host LMS on one - where the global boundary would show only a 500.
const ALL_STALE_MS = 5 * 60 * 1000;

// One Host LMS is counted on every request; a minute keeps a remount from recounting
// while the Refresh button still gets a fresh count on demand.
const ONE_STALE_MS = 60 * 1000;

export function allImportIngestDetailsQueryOptions(client: AxiosInstance) {
	return {
		queryKey: importIngestDetailsKeys.list(),
		queryFn: async (): Promise<ImportIngestDetails[]> => {
			const { data } = await client.get("/hostlmss/importIngestDetails");
			return data;
		},
		staleTime: ALL_STALE_MS,
		retry: false as const,
		throwOnError: false as const,
	};
}

// dcb-service refuses a larger scope (HostLmsService.MAX_SCOPED_HOST_LMS).
export const MAX_SCOPED_HOST_LMS = 50;

/** The named Host LMS only, each counted when asked. */
export function scopedImportIngestDetailsQueryOptions(
	client: AxiosInstance,
	hostLmsCodes: string[],
) {
	// Sorted so the same selection made in a different order shares one cache entry.
	const codes = [...hostLmsCodes].sort();
	return {
		queryKey: importIngestDetailsKeys.scoped(codes),
		queryFn: async (): Promise<ImportIngestDetails[]> => {
			const { data } = await client.get("/hostlmss/importIngestDetails", {
				params: { hostLmsCodes: codes.join(",") },
			});
			return data;
		},
		staleTime: ONE_STALE_MS,
		retry: false as const,
		throwOnError: false as const,
	};
}

export function importIngestDetailsQueryOptions(
	client: AxiosInstance,
	hostLmsId: string,
) {
	return {
		queryKey: importIngestDetailsKeys.detail(hostLmsId),
		queryFn: async (): Promise<ImportIngestDetails> => {
			const { data } = await client.get(
				`/hostlmss/importIngestDetails/${encodeURIComponent(hostLmsId)}`,
			);
			return data;
		},
		staleTime: ONE_STALE_MS,
		retry: false as const,
		throwOnError: false as const,
	};
}

export type ProcessingStateName = "PROCESSING_REQUIRED" | "SUCCESS" | "FAILURE";

export function processingStateCount(
	details: Pick<ImportIngestDetails, "processStates"> | undefined,
	state: ProcessingStateName,
): number {
	return (
		details?.processStates?.find((processState) => processState.value === state)
			?.count ?? 0
	);
}
