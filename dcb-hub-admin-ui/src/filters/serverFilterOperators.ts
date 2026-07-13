import {
	getGridBooleanOperators,
	getGridDateOperators,
	getGridNumericOperators,
	getGridSingleSelectOperators,
	getGridStringOperators,
	GridColDef,
	GridFilterOperator,
} from "@mui/x-data-grid-premium";

// The complete operator vocabulary buildFilterQuery can translate into Lucene.
// A column that offers anything outside this set is a trap: the unknown operator
// falls through buildFilterQuery's switch to `default: equalsQuery`, so the grid
// silently returns *equals* results under a different label - which is exactly
// how "is not" ended up behaving identically to "is".
export const serverSupportedOperators = new Set([
	// Text
	"contains",
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
		const supported = operators.filter((operator) =>
			serverSupportedOperators.has(operator.value),
		);

		if (supported.length === operators.length) {
			return column;
		}
		// Nothing left to offer - an unfilterable column beats a filter that lies.
		if (supported.length === 0) {
			return { ...column, filterable: false };
		}
		return { ...column, filterOperators: supported };
	});
