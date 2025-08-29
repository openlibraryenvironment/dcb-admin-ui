import { v4 as uuidv4 } from "uuid";
import {
	GridFilterModel,
	GridFilterItem,
	GridLogicOperator,
} from "@mui/x-data-grid-premium";
import { SearchCriterion } from "@models/SearchCriterion";
import { SearchField } from "@models/SearchField";
import { searchFieldPrefixes } from "src/constants/searchFieldPrefixes";
import { formatQueryPart } from "./formatQueryPart";
/**
 * Builds a CQL query string for dcb-locate from an array of criteria.
 */
export const buildQueryFromCriteria = (criteria: SearchCriterion[]): string => {
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

/**
 * Maps search criteria to the MUI DataGrid's filter model.
 * Note: This can only represent criteria that map to a grid column (e.g., Title).
 * Searches on fields like 'Author' will not appear as grid filters.
 */
export const mapCriteriaToFilterModel = (
	criteria: SearchCriterion[],
): GridFilterModel => {
	const items: GridFilterItem[] = [];
	criteria
		.filter((c) => c.value.trim() !== "")
		.forEach((criterion) => {
			let columnField: string | null = null;
			if (criterion.field === SearchField.Title) columnField = "title";
			if (criterion.field === SearchField.Keyword) columnField = "title"; // Map keyword to title column

			if (columnField) {
				items.push({
					field: columnField,
					operator: "contains",
					value: criterion.value,
				});
			}
		});

	// A limitation of GridFilterModel is a single logic operator for all items.
	// We default to AND, but switch to OR if any criterion uses it.
	const hasOr = criteria.some((c) => c.operator === "OR");
	return {
		items,
		logicOperator: hasOr ? GridLogicOperator.Or : GridLogicOperator.And,
	};
};

/**
 * Maps the MUI DataGrid's filter model back to search criteria.
 * This will replace existing criteria.
 */
export const mapFilterModelToCriteria = (
	filterModel: GridFilterModel,
): SearchCriterion[] => {
	const logicOp =
		(filterModel.logicOperator?.toUpperCase() as "AND" | "OR" | "NOT") || "AND";

	return filterModel.items.map((item, index) => {
		let field = SearchField.Keyword; // Default fallback
		if (item.field === "title") field = SearchField.Title;

		return {
			id: uuidv4(),
			field,
			value: item.value ?? "",
			operator: index === 0 ? "AND" : logicOp,
		};
	});
};
