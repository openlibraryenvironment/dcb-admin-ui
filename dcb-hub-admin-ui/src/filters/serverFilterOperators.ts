import {
	getGridBooleanOperators,
	getGridDateOperators,
	getGridNumericOperators,
	getGridSingleSelectOperators,
	getGridStringOperators,
	GridColDef,
	GridFilterOperator,
} from "@mui/x-data-grid-premium";

import i18n from "@/i18n";

// The complete operator vocabulary buildFilterQuery can translate into Lucene.
// A column that offers anything outside this set is a trap: the unknown operator
// falls through buildFilterQuery's switch to `default: equalsQuery`, so the grid
// silently returns *equals* results under a different label - which is exactly
// how "is not" ended up behaving identically to "is".
export const serverSupportedOperators = new Set([
	// Text
	"contains",
	"containsPhrase",
	"does not contain",
	"doesNotContain",
	"equals",
	"=",
	"is",
	"does not equal",
	"Does not equal",
	"doesNotEqual",
	"!=",
	"not",
	"isAnyOf",
	// Numeric and duration
	"<",
	"<=",
	">",
	">=",
	"between",
	// Dates
	"luceneDateRange",
	"onOrAfter",
	"onOrBefore",
	"last30Days",
	"last90Days",
]);

// dcb-service compiles these to SQL NOT (field = x), which is NULL, not true, where the field
// is blank: such rows are left out, and the label says so
const NEGATIVE_LABEL_KEYS: Record<string, string> = {
	"does not contain": "ui.data_grid.server_operators.does_not_contain",
	doesNotContain: "ui.data_grid.server_operators.does_not_contain",
	"does not equal": "ui.data_grid.server_operators.does_not_equal",
	"Does not equal": "ui.data_grid.server_operators.does_not_equal",
	doesNotEqual: "ui.data_grid.server_operators.does_not_equal",
	"!=": "ui.data_grid.server_operators.does_not_equal",
	not: "ui.data_grid.server_operators.is_not",
};

const labelled = (operator: GridFilterOperator): GridFilterOperator => {
	const key = NEGATIVE_LABEL_KEYS[operator.value];
	return key ? { ...operator, label: i18n.t(key) } : operator;
};

// Every dcb-service id is a uuid, which Postgres cannot ILIKE: a substring filter on one fails
const SUBSTRING_OPERATORS = new Set([
	"contains",
	"containsPhrase",
	"does not contain",
	"doesNotContain",
]);

// What MUI hands a column that never declared `filterOperators` of its own.
const defaultOperatorsForType = (type?: string): GridFilterOperator[] => {
	switch (type) {
		case "singleSelect":
			return getGridSingleSelectOperators();
		case "number":
			return getGridNumericOperators();
		case "boolean":
			return getGridBooleanOperators();
		case "date":
			return getGridDateOperators();
		case "dateTime":
			return getGridDateOperators(true);
		default:
			return getGridStringOperators();
	}
};

/**
 * Strips any operator the server cannot answer from a server-filtered grid's
 * columns, so the filter panel can only ever offer what buildFilterQuery
 * implements. Columns that already declare a supported-only operator set are
 * returned by reference, so this stays cheap and memo-friendly.
 *
 * Without this, every column with `filterable: true` and no explicit
 * `filterOperators` inherits MUI's full default set - handing users
 * startsWith / endsWith / isEmpty / isNotEmpty, none of which the Lucene
 * builder implements.
 */
export const constrainToServerOperators = (
	columns: GridColDef[],
): GridColDef[] =>
	columns.map((column) => {
		if (column.filterable === false) {
			return column;
		}

		const operators =
			column.filterOperators ?? defaultOperatorsForType(column.type);
		const supported = operators.filter(
			(operator) =>
				serverSupportedOperators.has(operator.value) &&
				!(column.field === "id" && SUBSTRING_OPERATORS.has(operator.value)),
		);
		const negative = supported.some(
			(operator) => operator.value in NEGATIVE_LABEL_KEYS,
		);

		if (supported.length === operators.length && !negative) {
			return column;
		}
		// Nothing left to offer - an unfilterable column beats a filter that lies.
		if (supported.length === 0) {
			return { ...column, filterable: false };
		}
		return { ...column, filterOperators: supported.map(labelled) };
	});
