type FailedChecks = {
	code: string;
	description: string;
};
export function getRequestError(failedChecks: FailedChecks[]): string {
	if (failedChecks?.[0]?.code == "DUPLICATE_REQUEST_ATTEMPT") {
		return "requesting.staff_request.patron.error.request.duplicate";
	} else {
		return "requesting.staff_request.patron.error.request.generic";
	}
}
