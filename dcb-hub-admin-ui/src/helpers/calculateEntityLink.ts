export function calculateEntityLink(entityType: string) {
	// Basically a translator for table names to DCB Admin references.
	// Primarily intended for translating table names to links.
	switch (entityType) {
		case "agency":
			return "agencies";
		case "library":
			return "libraries";
		case "host_lms":
			return "hostlmss";
		case "library_group":
			return "groups";
		case "location":
			return "locations";
		case "patron_request":
			return "patronRequests";
		case "reference_value_mapping":
			return "mappings/allReferenceValue";
		case "numeric_range_mapping":
			return "mappings/allNumericRange";
		case "bib_record":
			return "bibs";
	}
}
