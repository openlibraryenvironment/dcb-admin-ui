import axios, { AxiosInstance } from "axios";
import { isHandledGlobally } from "@helpers/globalHttpErrors";
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
	| {
			kind: "cancelled";
			paused: boolean;
			supplierStatus?: string;
			/** dcb-service's own account of what it did, where it gives one. */
			message?: string;
	  }
	| { kind: "reactivated"; activeNow: boolean }
	| { kind: "forbidden" }
	| { kind: "notFound" }
	| { kind: "failed"; message?: string; reference: string | null };

// HandleSupplierRequestCancelled's statuses, 8.71.0-9.3.0. After them the item has shipped,
// and cancelling its hold strands it (DCB-2193): 9.2.0 refuses skip outside them with 409
// SR_NOT_SKIPPABLE, 8.71.0 does not, and no release guards cancel.
const BEFORE_SHIPMENT: ReadonlySet<string> = new Set([
	"REQUEST_PLACED_AT_SUPPLYING_AGENCY",
	"CONFIRMED",
	"REQUEST_PLACED_AT_BORROWING_AGENCY",
	"REQUEST_PLACED_AT_PICKUP_AGENCY",
]);

export const availableSupplierActions = (
	supplier: { isActive?: boolean | null } | null | undefined,
	request:
		| { status?: string | null; previousStatus?: string | null }
		| null
		| undefined,
): SupplierAction[] => {
	if (!supplier) return [];
	if (!supplier.isActive) return ["reactivate"];

	const status = request?.status ?? "";
	if (BEFORE_SHIPMENT.has(status)) return ["skip", "cancel"];
	// An error raised before shipment can still have its hold cancelled; skipping it would
	// need the status HandleSupplierRequestCancelled reads, which ERROR is not
	if (status === "ERROR" && BEFORE_SHIPMENT.has(request?.previousStatus ?? ""))
		return ["cancel"];
	return [];
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
				message: data?.message ?? undefined,
			};
		}
		// A missing `active` is read as false, which would pause the supplier instead
		const { data } = await client.patch(`${base}/active`, { active: true });
		return { kind: "reactivated", activeNow: data?.activeNow === true };
	} catch (error) {
		if (isHandledGlobally(error)) throw error;
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
