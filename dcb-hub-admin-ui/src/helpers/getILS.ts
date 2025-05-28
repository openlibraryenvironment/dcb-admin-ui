export function getILS(lmsClientClass: string): string {
	// Can be expanded if we want to display both here
	// for libraries with 2 host lms
	// also translation keys etc
	switch (true) {
		case lmsClientClass?.toLowerCase().includes("alma"):
			return "Alma";
		case lmsClientClass?.toLowerCase().includes("folio"):
			return "FOLIO";
		case lmsClientClass?.toLowerCase().includes("polaris"):
			return "Polaris";
		case lmsClientClass?.toLowerCase().includes("sierra"):
			return "Sierra";
		default:
			return "UNKNOWN";
	}
}
