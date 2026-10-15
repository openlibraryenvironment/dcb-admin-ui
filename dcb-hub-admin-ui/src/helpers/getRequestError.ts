type FailedChecks = {
	code: string;
	description: string;
};
export function getRequestError(failedChecks: FailedChecks[]): string {
	switch (failedChecks?.[0]?.code) {
		case "DUPLICATE_REQUEST_ATTEMPT":
			return "requesting.staff_request.patron.error.request.duplicate";
		case "SUPPLIER_CANNOT_SUPPLY":
			return "requesting.staff_request.patron.error.request.supplier_cannot_supply";
		default:
			return "requesting.staff_request.patron.error.request.generic";
	}
}
