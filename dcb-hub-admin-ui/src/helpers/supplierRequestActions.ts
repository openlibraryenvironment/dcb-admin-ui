import axios, { AxiosInstance } from "axios";
import { requestReferenceOf } from "@helpers/requestReference";

/**
 * dcb-service's fixes for a request stuck at its supplier, SupplierRequestController.
 *
 * On 8.71.0, skip and cancel act on the patron request's ACTIVE supplier request whatever
 * id is sent, and a second cancel fails, so both are offered only while the supplier is
 * active; reactivate only once it is not.
 */
export type SupplierAction = "skip" | "cancel" | "reactivate";

export type SupplierActionOutcome =
	| { kind: "skipped" }
	/** `paused` is false when the supplier did not report the hold cancelled. */
	| { kind: "cancelled"; paused: boolean; supplierStatus?: string }
	| { kind: "reactivated"; activeNow: boolean }
	| { kind: "forbidden" }
	| { kind: "notFound" }
	| { kind: "failed"; message?: string; reference: string | null };

export const availableSupplierActions = (
	supplier: { isActive?: boolean | null } | null | undefined,
): SupplierAction[] => {
	if (!supplier) return [];
	return supplier.isActive ? ["skip", "cancel"] : ["reactivate"];
};

export const runSupplierAction = async (
	client: AxiosInstance,
	action: SupplierAction,
	supplierRequestId: string,
): Promise<SupplierActionOutcome> => {
	const base = `/suppliers/requests/${encodeURIComponent(supplierRequestId)}`;

	try {
		if (action === "skip") {
			// Its 200 says re-resolution was triggered whatever happened; the refetch tells
			await client.post(`${base}/skip`);
			return { kind: "skipped" };
		}
		if (action === "cancel") {
			const { data } = await client.post(`${base}/cancel`, {});
			return {
				kind: "cancelled",
				paused: data?.paused === true,
				supplierStatus: data?.supplierStatus ?? undefined,
			};
		}
		// A missing `active` is read as false, which would pause the supplier instead
		const { data } = await client.patch(`${base}/active`, { active: true });
		return { kind: "reactivated", activeNow: data?.activeNow === true };
	} catch (error) {
		if (!axios.isAxiosError(error))
			return { kind: "failed", reference: requestReferenceOf(error) };

		switch (error.response?.status) {
			case 403:
				return { kind: "forbidden" };
			case 404:
				return { kind: "notFound" };
			default:
				return {
					kind: "failed",
					message: (error.response?.data as { message?: string } | undefined)
						?.message,
					reference: requestReferenceOf(error),
				};
		}
	}
};
