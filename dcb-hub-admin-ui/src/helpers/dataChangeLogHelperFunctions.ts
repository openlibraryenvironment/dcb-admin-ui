import { capitalize } from "lodash";
import { splitOnCapitals } from "./splitOnCapitals";

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

export function tableNameToEntityName(entityType: string) {
	switch (entityType) {
		case "agency":
			return "agencies.agencies_one";
		case "consortium":
			return "nav.consortium.name";
		case "functional_setting":
			return "consortium.settings.one";
		case "library":
			return "libraries.library";
		case "host_lms":
			return "hostlms_one";
		case "library_contact":
			return "libraries.contacts.entity_name";
		case "library_group":
			return "groups.groups_one";
		case "library_group_member":
			return "groups.group_member";
		case "location":
			return "locations.location_one";
		case "patron_request":
			return "patron_requests.pr_one";
		case "reference_value_mapping":
			return "mappings.ref_value_one";
		case "numeric_range_mapping":
			return "mappings.num_range_one";
		case "bib_record":
			return "bibRecords.bib_one";
		default:
			// If no match, return the original string or a default value
			return entityType;
	}
}

export function fieldNameToLabel(fieldName: string): string {
	// Define any special cases that don't meet the standard rule.
	const specialCases: { [key: string]: string } = {
		id: "ID",
		idp: "IDP",
		url: "URL",
		api: "API",
		lms: "LMS",
	};

	// Split the words
	const words = fieldName.split("_");
	// Check for special cases in the words
	const processedWords = words.map(
		(word) => specialCases[word.toLowerCase()] || word,
	);

	// Join the words with spaces, replacing underscores.
	const label = processedWords.join(" ");

	// Only capitalise the first letter of the whole string
	return label.charAt(0).toUpperCase() + label.slice(1);
}

export function gridFieldNameToLabel(fieldName: string): string {
	// Define any special cases that don't meet the standard rule.
	const specialCases: { [key: string]: string } = {
		id: "ID",
		idp: "IDP",
		url: "URL",
		api: "API",
		lms: "LMS",
	};

	// Split the words
	const words = splitOnCapitals(fieldName);
	// Check for special cases in the words
	const processedWords = words.map(
		(word) => specialCases[word.toLowerCase()] || word,
	);

	// Join the words with spaces, replacing underscores.
	const label = processedWords.join(" ");

	// Only capitalise the first letter of the whole string
	return capitalize(label);
}
