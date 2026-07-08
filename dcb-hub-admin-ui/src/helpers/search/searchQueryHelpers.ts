import { v4 as uuidv4, validate } from "uuid";
import { SearchCriterion } from "@models/SearchCriterion";
import { SearchField } from "@models/SearchField";
import { searchFieldPrefixes } from "@constants/searchFieldPrefixes";
import { formatQueryPart } from "./formatQueryPart";

/**
 * Builds a CQL query string for dcb-locate from an array of criteria.
 */
export const buildQueryFromCriteria = (criteria: SearchCriterion[]): string => {
	if (
		criteria.length === 1 &&
		criteria[0].field === SearchField.ClusterRecordID &&
		criteria[0].value
	) {
		return criteria[0].value;
	}
	return criteria
		.filter((c) => c.value.trim() !== "")
		.map((c, index) => {
			const queryPart = formatQueryPart(c.field, c.value);
			return index > 0 ? `${c.operator} (${queryPart})` : `(${queryPart})`;
		})
		.join(" ");
};

// Ensures the correct prefixes are used
const prefixToSearchFieldMap: { [key: string]: SearchField } = Object.entries(
	searchFieldPrefixes,
).reduce((acc, [key, value]) => ({ ...acc, [value]: key as SearchField }), {});

// Some fields shouldn't have spaces adding, others need them.
const fieldsWithNoSpace = new Set([
	SearchField.ISSN,
	SearchField.ISBN,
	SearchField.Subject,
	SearchField.Language,
]);

/**
 * Parses a query string from the URL into an array of SearchCriterion objects.
 * This is the reverse of buildQueryFromCriteria.
 * It exists basically so we don't completely mess up the URL
 */
export const parseQueryToCriteria = (query: string): SearchCriterion[] => {
	if (!query || query.trim() === "") return [];

	// Check if the query is a UUID (indicating a ClusterRecordID search)
	if (validate(query)) {
		return [
			{
				id: uuidv4(),
				field: SearchField.ClusterRecordID,
				value: query,
				operator: "AND",
			},
		];
	}

	const criteria: SearchCriterion[] = [];
	const regex = /(AND|OR|NOT)?\s*\((.*?)\)/g;
	let match;

	while ((match = regex.exec(query)) !== null) {
		const operator = (match[1] as "AND" | "OR" | "NOT") || "AND";
		const content = match[2]; // Content inside parentheses

		let foundField: SearchField | undefined;
		let foundValue = "";

		for (const prefix of Object.keys(prefixToSearchFieldMap)) {
			if (content.startsWith(prefix)) {
				foundField = prefixToSearchFieldMap[prefix];
				const separator = fieldsWithNoSpace.has(foundField) ? "" : " ";
				let valuePart = content.substring(prefix.length);

				if (valuePart.startsWith(separator)) {
					valuePart = valuePart.substring(separator.length);
				}

				foundValue =
					valuePart.startsWith('"') && valuePart.endsWith('"')
						? valuePart.slice(1, -1)
						: valuePart;
				break;
			}
		}

		if (foundField) {
			criteria.push({
				id: uuidv4(),
				field: foundField,
				value: foundValue,
				operator,
			});
		}
	}
	if (criteria.length > 0) criteria[0].operator = "AND";
	return criteria;
};
