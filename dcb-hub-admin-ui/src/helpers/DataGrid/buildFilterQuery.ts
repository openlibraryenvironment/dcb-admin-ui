import {
	conversionFields,
	conversionFieldsMap,
	numericOperators,
} from "src/constants/dataGridConstants";

export const buildFilterQuery = (
	field: string,
	operator: string,
	value: any,
) => {
	const fromValue = value[0];
	const toValue = value[1];
	const isConversionField = conversionFields.includes(field);
	const conversionFieldFactor = conversionFieldsMap[field];

	// Goes first because it needs to be handled before anything  else
	if (operator === "between" && value) {
		// At the minute we only need to handle numeric fields.
		// If the value isn't numeric we must remove spaces
		if (conversionFields.includes(field)) {
			const fromSeconds = fromValue * conversionFieldFactor;
			const toSeconds = toValue * conversionFieldFactor;
			// May not need all of this
			if (fromSeconds && toSeconds) {
				return `${field}:[${fromSeconds} TO ${toSeconds}]`;
			} else if (fromSeconds && !toSeconds) {
				return `${field}:[${fromSeconds} TO *]`;
			} else if (toSeconds && !fromSeconds) {
				return `${field}:[* TO ${toSeconds}]`;
			}
			return "";
		}
		// Not a conversion field
		else {
			if (fromValue && toValue) {
				return `${field}:[${fromValue} TO ${toValue}]`;
			} else if (fromValue && !toValue) {
				return `${field}:[${fromValue} TO *]`;
			} else if (toValue && !fromValue) {
				return `${field}:[* TO ${toValue}]`;
			}
			return "";
		}
	}

	const replacedValue = numericOperators.includes(operator)
		? value
		: value.replaceAll(" ", "?");
	// Question marks are used to replace spaces in search terms- see Lucene docs https://lucene.apache.org/core/9_9_1/queryparser/org/apache/lucene/queryparser/classic/package-summary.html#package.description
	// Lucene powers our server-side querying so we need to get expressions into the right syntax.
	// We're currently only supporting contains and equals, but other operators are possible - see docs.
	// We will also need to introduce type handling - i.e. for UUIDs, numbers etc - based on the field.

	const convertedValue = replacedValue * conversionFieldFactor;
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

	if (!field || !value) {
		// Handle the case when the field or value is empty
		if (value != 0) {
			return null;
		}
		// If the value is actually zero, this is valid so don't return null
	}

	switch (operator) {
		case "contains":
			return containsQuery;
		case "equals":
		case "=":
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
