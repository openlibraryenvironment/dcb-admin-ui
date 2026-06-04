import i18n from "@/i18n";
export enum DCBStatus {
	SUBMITTED_TO_DCB,
	PATRON_VERIFIED,
	RESOLVED,
	// Added in preparation for moving to next supplier - when a supplier cancels a request we
	// want to resubmit the request to the next possible supplier, creating a new supplier_request
	// or if there are no more suppliers possible, move to NO_ITEMS_SELECTABLE_AT_ANY_AGENCY
	NOT_SUPPLIED_CURRENT_SUPPLIER,
	NO_ITEMS_SELECTABLE_AT_ANY_AGENCY,
	REQUEST_PLACED_AT_SUPPLYING_AGENCY,
	// The supplying agency has confirmed the actual item which will be shipped
	CONFIRMED,
	// No further processing by DCB as this request should be handled by existing local (Same host/agency request) workflow.
	HANDED_OFF_AS_LOCAL,
	REQUEST_PLACED_AT_BORROWING_AGENCY,
	REQUEST_PLACED_AT_PICKUP_AGENCY,
	RECEIVED_AT_PICKUP,
	READY_FOR_PICKUP,
	LOANED, // Currently on loan
	PICKUP_TRANSIT, // In transit to pickup location
	RETURN_TRANSIT, // In transit back to owning location from lender
	CANCELLED,
	COMPLETED, // Everything is finished, regardless and ready to be finalised
	FINALISED, // We've cleaned up everything and this is the end of the line
	ERROR,
	ARCHIVED,
}

const statusKeys = Object.keys(DCBStatus).filter((key) => isNaN(Number(key)));

export const dcbStatusValueOptions = statusKeys.map((key) => {
	const translationKey = `patron_request.statuses.${key}`;
	return {
		value: key, // The value to filter by (e.g., "SUBMITTED_TO_DCB")
		label: i18n.t(translationKey), // The translated label (e.g., "Submitted to DCB")
	};
});
