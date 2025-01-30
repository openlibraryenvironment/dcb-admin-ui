import { isEmpty } from "lodash";

export const getErrorMessageKey = (message: string, type: string): string => {
	if (!message || isEmpty(message)) {
		return "mappings.unknown_error";
	}
	switch (true) {
		case message.includes("Invalid file type"):
			return "mappings.invalid_file_type";
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
		case message.includes("expected headers") && type == "Locations":
			return "mappings.validation_expected_headers_nrm";
		case message.includes("provide a Host LMS"):
			return "mappings.validation_no_hostlms";
		case message.includes("fromContext or toContext") &&
			type == "Reference value mappings":
			return "mappings.mismatched_context";
		case message.includes(
			"The context does not match the Host LMS code you supplied.",
		) && type == "Numeric range mappings":
			return "mappings.mismatched_context_nrm";
		case message.includes("mandatory field"):
			return "mappings.mandatory_field_blank";
		case message.includes("fewer columns"):
			return "locations.import.error.column_numbers";
		case message.includes(
			"The fromCategory or toCategory of this mapping does not match the category you have specified",
		):
			return "mappings.new.error.validation.invalid_category";
		default:
			return "mappings.unknown_error";
	}
};
