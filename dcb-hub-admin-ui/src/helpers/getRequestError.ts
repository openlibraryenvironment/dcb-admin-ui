type FailedChecks = {
	code: string;
	description: string;
};
export function getRequestError(failedChecks: FailedChecks[]): string {
	switch (failedChecks?.[0]?.code) {
		case "DUPLICATE_REQUEST_ATTEMPT":
			return "requesting.staff_request.patron.error.request.duplicate";
		case "PREFLIGHT_CHECKS_TIMED_OUT":
			return "requesting.staff_request.patron.error.request.timed_out";
		default:
			return "requesting.staff_request.patron.error.request.generic";
	}
}
