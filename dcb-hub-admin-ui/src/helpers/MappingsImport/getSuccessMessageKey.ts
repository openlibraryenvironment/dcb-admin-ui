export const getSuccessKey = (
	// category: string,
	type: string,
	replacement: boolean,
	ignoredCount: number,
): string => {
	if (replacement) {
		if (type == "Locations") {
			if (ignoredCount > 0) {
				return "locations.import.successful_replacement_ignored";
			}
			return "locations.import.successful_replacement";
		} else {
			return "mappings.upload_success_replacement";
		}
	} else {
		if (type == "Locations") {
			if (ignoredCount > 0) {
				return "locations.import.success_ignored";
			}
			return "locations.import.success";
		} else {
			return "mappings.upload_success";
		}
	}
};
