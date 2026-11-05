import { queryOptions } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";

import { lmsFanOutQuery } from "@helpers/queryPolicy";

/** HostLmsItem as HostLmssController serialises it; absent fields are omitted. */
export interface LiveItem {
	localId?: string;
	localRequestId?: string;
	status?: string;
	rawStatus?: string;
	barcode?: string;
	renewalCount?: number;
	renewable?: boolean;
	holdCount?: number;
	holdingId?: string;
	bibId?: string;
}

/**
 * Micronaut routes on the decoded path, so an encoded "/" still splits the segment and
 * the lookup cannot reach the item.
 */
export const canLookUpLive = (item: {
	barcode?: string | null;
	hostLmsCode?: string | null;
}): boolean =>
	!!item.hostLmsCode && !!item.barcode && !item.barcode.includes("/");

/**
 * One click, two to four calls into the member's LMS depending on its type, and no
 * server-side rate limit: fetched only while the dialog is open, never retried on a 4xx.
 */
export const liveItemQuery = (
	client: AxiosInstance,
	hostLmsCode: string,
	barcode: string,
) =>
	queryOptions({
		...lmsFanOutQuery,
		queryKey: ["liveItem", hostLmsCode, barcode],
		queryFn: async ({ signal }) =>
			(
				await client.get<LiveItem>(
					`/hostlmss/${encodeURIComponent(hostLmsCode)}/item/${encodeURIComponent(barcode)}`,
					{ signal },
				)
			).data,
		// Reopening the dialog straight away should not ask the LMS again
		staleTime: 30_000,
		refetchOnWindowFocus: false,
		throwOnError: false,
	});
