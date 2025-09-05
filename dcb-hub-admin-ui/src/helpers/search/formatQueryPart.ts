import { SearchField } from "@models/SearchField";
import { searchFieldPrefixes } from "src/constants/searchFieldPrefixes";
import { languageAliasMap } from "src/constants/searchLanguageAliasMap";

// Gets the query in the format for dcb-locate
export const formatQueryPart = (field: SearchField, value: string): string => {
	// Special handling for ClusterRecordID - return the UUID directly
	if (field === SearchField.ClusterRecordID) {
		return value;
	}

	const prefix = searchFieldPrefixes[field];
	let processedValue = value;

	// Apply language alias mapping for language field
	if (field === SearchField.Language) {
		const lowerValue = value.toLowerCase();
		processedValue = languageAliasMap[lowerValue] || value;
	}

	const formattedValue = processedValue.includes(" ")
		? `"${processedValue}"`
		: processedValue;

	if (
		field === SearchField.ISSN ||
		field === SearchField.ISBN ||
		field === SearchField.Subject ||
		field === SearchField.Language
	) {
		return `${prefix}${formattedValue}`;
	}
	return `${prefix} ${formattedValue}`;
};
