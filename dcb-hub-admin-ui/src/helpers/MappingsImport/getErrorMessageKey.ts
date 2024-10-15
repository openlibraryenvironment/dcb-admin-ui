export const getErrorMessageKey = (message: string, type: string): string => {
	switch (true) {
		case message.includes("exceeds the limit"):
			return "mappings.file_too_large";
		case message.includes("File is empty"):
			return "mappings.file_empty";
		case message.includes("You can only upload"):
			return "mappings.wrong_file_type";
		case message.includes("Empty value"):
			return "mappings.validation_missing_values";
		case message.includes("expected headers") &&
			type == "Reference value mappings":
			return "mappings.validation_expected_headers";
		case message.includes("expected headers") &&
			type == "Numeric range mappings":
			return "mappings.validation_expected_headers_nrm";
		case message.includes("provide a Host LMS"):
			return "mappings.validation_no_hostlms";
		case message.includes("fromContext or toContext") &&
			type == "Reference value mappings":
			return "mappings.mismatched_context";
		case message.includes("fromContext or toContext") &&
			type == "Numeric range mappings":
			return "mappings.mismatched_context_nrm";
		default:
			return "mappings.unknown_error";
	}
};
