import dayjs from "dayjs";
import {
	conversionFields,
	conversionFieldsMap,
	numericOperators,
} from "@constants/dataGridConstants";

export const buildFilterQuery = (
	field: string,
	operator: string,
	value: any,
) => {
	// 1. VALUE-INDEPENDENT OPERATORS
	// These operators do not require user input. Handle them before the guard.
	if (operator === "last30Days") {
		const end = dayjs().toISOString();
		const start = dayjs().subtract(30, "day").toISOString();
		return `${field}:[${start} TO ${end}]`;
	}

	if (operator === "last90Days") {
		const end = dayjs().toISOString();
		const start = dayjs().subtract(90, "day").toISOString();
		return `${field}:[${start} TO ${end}]`;
	}

	// 2. THE THREAD SAVER (GUARD)
	// If the user hasn't typed anything yet, bail out cleanly.
	// Note: value === 0 is structurally valid for numerics, so we check explicitly.
	if (value === undefined || value === null || value === "") {
		return "";
	}

	// 3. SAFE ARRAY EXTRACTION
	// Only extract indices if the value is actually an array (e.g., from a date range picker).
	const isArray = Array.isArray(value);
	const fromValue = isArray ? value[0] : undefined;
	const toValue = isArray ? value[1] : undefined;

	const isConversionField = conversionFields.includes(field);
	const conversionFieldFactor = conversionFieldsMap[field];

	// 4. RANGE OPERATORS
	if (operator === "between") {
		if (isConversionField) {
			const fromSeconds = fromValue
				? fromValue * conversionFieldFactor
				: undefined;
			const toSeconds = toValue ? toValue * conversionFieldFactor : undefined;

			if (fromSeconds && toSeconds)
				return `${field}:[${fromSeconds} TO ${toSeconds}]`;
			if (fromSeconds && !toSeconds) return `${field}:[${fromSeconds} TO *]`;
			if (!fromSeconds && toSeconds) return `${field}:[* TO ${toSeconds}]`;
			return "";
		}

		if (fromValue && toValue) return `${field}:[${fromValue} TO ${toValue}]`;
		if (fromValue && !toValue) return `${field}:[${fromValue} TO *]`;
		if (!fromValue && toValue) return `${field}:[* TO ${toValue}]`;
		return "";
	}

	if (operator === "luceneDateRange" && isArray) {
		const startStr = fromValue ? dayjs(fromValue).toISOString() : "*";
		const endStr = toValue ? dayjs(toValue).toISOString() : "*";

		if (startStr === "*" && endStr === "*") return "";
		return `${field}:[${startStr} TO ${endStr}]`;
	}

	// 5. DATE OPERATORS
	if (operator === "onOrAfter" || operator === "onOrBefore") {
		const dateStr = dayjs(value).toISOString();

		if (operator === "onOrAfter") return `${field}:[${dateStr} TO *]`;
		if (operator === "onOrBefore") return `${field}:[* TO ${dateStr}]`;
	}

	// 6. STANDARD OPERATORS
	const replacedValue = numericOperators.includes(operator)
		? value
		: String(value).replaceAll(" ", "?");

	// Question marks are used to replace spaces in search terms- see Lucene docs https://lucene.apache.org/core/9_9_1/queryparser/org/apache/lucene/queryparser/classic/package-summary.html#package.description
	// Lucene powers our server-side querying so we need to get expressions into the right syntax.
	// We're currently only supporting contains and equals, but other operators are possible - see docs.
	// We will also need to introduce type handling - i.e. for UUIDs, numbers etc - based on the field.

	const convertedValue = isConversionField
		? Number(replacedValue) * conversionFieldFactor
		: null;

	const containsQuery = `${field}:*${replacedValue}*`;
	const doesNotContainQuery = `*:* AND NOT (${containsQuery})`;
	const equalsQuery = isConversionField
		? `${field}:${convertedValue}`
		: `${field}:${replacedValue}`;
	const doesNotEqualQuery = `*:* AND NOT (${equalsQuery})`;

	const lessThanQueryInclusive = isConversionField
		? `${field}:[* TO ${convertedValue}]`
		: `${field}:[* TO ${replacedValue}]`;
	const lessThanQueryExclusive = isConversionField
		? `${field}:{* TO ${convertedValue}}`
		: `${field}:{* TO ${replacedValue}}`;
	const greaterThanQueryInclusive = isConversionField
		? `${field}:[${convertedValue} TO *]`
		: `${field}:[${replacedValue} TO *]`;
	const greaterThanQueryExclusive = isConversionField
		? `${field}:{${convertedValue} TO *}`
		: `${field}:{${replacedValue} TO *}`;

	switch (operator) {
		case "contains":
			return containsQuery;
		case "equals":
		case "=":
		case "is": // singleSelect columns (patron/supplying library, pickup location)
			return equalsQuery;
		case "does not equal":
		case "!=":
		case "Does not equal":
			// Note - the NOT operator can not be used with just one term. So we have to improvise
			// https://lucene.apache.org/core/9_9_1/queryparser/org/apache/lucene/queryparser/classic/package-summary.html#not-heading
			return doesNotEqualQuery;
		case "does not contain":
			return doesNotContainQuery;
		case "<=":
			return lessThanQueryInclusive;
		case "<":
			return lessThanQueryExclusive;
		case ">=":
			return greaterThanQueryInclusive;
		case ">":
			return greaterThanQueryExclusive;
		default:
			return equalsQuery;
	}
};
