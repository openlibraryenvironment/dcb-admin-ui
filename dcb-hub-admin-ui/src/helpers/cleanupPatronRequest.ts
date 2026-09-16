import axios from "axios";
import { cleanupStatuses } from "@constants/statuses/cleanupStatuses";
import { untrackedStatuses } from "@constants/statuses/untrackedStatuses";

/** The physical item is with the patron, or on its way to or from them. */
export const itemOutStatuses = [
	"PICKUP_TRANSIT",
	"RECEIVED_AT_PICKUP",
	"READY_FOR_PICKUP",
	"LOANED",
	"RETURN_TRANSIT",
	"AWAITING_RETURN_TO_SUPPLIER",
];

/** Cleanup can never apply: the request is finished, or is not DCB's to finish. */
export const neverCleanableStatuses = [
	"COMPLETED",
	"FINALISED",
	"CANCELLED",
	"ARCHIVED",
	"HANDED_OFF_AS_LOCAL",
];

export interface CleanableRequest {
	id?: string;
	status?: string;
	isTooLong?: boolean | null;
}

/**
 * Whether to offer cleanup for this request.
 *
 * Guarded (dcb-service 9.0.0 and later) the server decides: it refuses an item-out request
 * with a 409 the caller can override, so the UI only filters what cleanup can never apply
 * to. Unguarded (8.71.0) there is no refusal and no override, so this list is the only
 * gate - and item-out requests are offered solely once tracking has given up on them
 * (isTooLong), which consortium staff are otherwise unable to clear.
 */
export const isCleanupEligible = (
	request: CleanableRequest,
	guarded: boolean,
): boolean => {
	const status = request?.status;

	if (!status) return false;

	if (guarded) return !neverCleanableStatuses.includes(status);

	return (
		cleanupStatuses.includes(status) ||
		(itemOutStatuses.includes(status) && request.isTooLong === true)
	);
};

export type CleanupOutcome =
	| { kind: "cleaned" }
	| { kind: "refused"; status?: string; detail?: string }
	| { kind: "forbidden" }
	| { kind: "notFound" }
	| { kind: "failed"; detail?: string };

interface CleanupOptions {
	override?: boolean;
	refreshFirst?: boolean;
}

/**
 * Check the request for updates, then clean it up.
 *
 * Refreshing first is the point of the guarded flow: a request can have moved on since the
 * grid was loaded, and the server guards on its stored state. An override follows a refusal
 * that has just refreshed the request, so it does not poll the host systems twice.
 */
export const cleanupPatronRequest = async (
	apiBase: string,
	accessToken: string | undefined,
	request: CleanableRequest,
	{ override = false, refreshFirst = false }: CleanupOptions = {},
): Promise<CleanupOutcome> => {
	const headers = { Authorization: `Bearer ${accessToken}` };
	const base = `${apiBase}/patrons/requests/${request.id}`;

	try {
		if (
			refreshFirst &&
			!override &&
			!untrackedStatuses.includes(String(request.status))
		) {
			await axios.post(`${base}/update`, {}, { headers });
		}

		await axios.post(
			`${base}/transition/cleanup`,
			{},
			{ headers, params: override ? { force: true } : undefined },
		);

		return { kind: "cleaned" };
	} catch (error) {
		if (!axios.isAxiosError(error)) return { kind: "failed" };

		const body = error.response?.data as
			| {
					detail?: string;
					patronRequestStatus?: string;
					lastKnownItemOutStatus?: string;
			  }
			| undefined;

		switch (error.response?.status) {
			case 409:
				return {
					kind: "refused",
					status: body?.lastKnownItemOutStatus ?? body?.patronRequestStatus,
					detail: body?.detail,
				};
			case 403:
				return { kind: "forbidden" };
			case 404:
				return { kind: "notFound" };
			default:
				return { kind: "failed", detail: body?.detail };
		}
	}
};
