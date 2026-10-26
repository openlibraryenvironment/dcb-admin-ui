import axios from "axios";

/**
 * DCB is waiting only for the supplying library to report the item back: cancelled after it
 * shipped, or returned after a loan. Nothing else can be confirmed returned.
 */
export const confirmReturnStatuses = [
	"AWAITING_RETURN_TO_SUPPLIER",
	"RETURN_TRANSIT",
];

export const isConfirmReturnEligible = (status?: string | null): boolean =>
	!!status && confirmReturnStatuses.includes(status);

export type ConfirmReturnOutcome =
	| { kind: "confirmed" }
	| { kind: "refused"; status?: string; detail?: string }
	| { kind: "forbidden" }
	| { kind: "notFound" }
	| { kind: "failed"; detail?: string };

export const confirmItemReturned = async (
	apiBase: string,
	accessToken: string | undefined,
	patronRequestId: string,
): Promise<ConfirmReturnOutcome> => {
	try {
		await axios.post(
			`${apiBase}/patrons/requests/${patronRequestId}/transition/confirm-returned`,
			{},
			{ headers: { Authorization: `Bearer ${accessToken}` } },
		);

		return { kind: "confirmed" };
	} catch (error) {
		if (!axios.isAxiosError(error)) return { kind: "failed" };

		const body = error.response?.data as
			{ detail?: string; patronRequestStatus?: string } | undefined;

		switch (error.response?.status) {
			case 409:
				return {
					kind: "refused",
					status: body?.patronRequestStatus,
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
