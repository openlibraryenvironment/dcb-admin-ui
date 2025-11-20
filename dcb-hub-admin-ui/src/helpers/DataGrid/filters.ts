import { betweenFilterOperator } from "src/helpers/DataGrid/rangeFilterOperator";
import {
	getGridNumericOperators,
	getGridSingleSelectOperators,
	getGridStringOperators,
	GridCellParams,
	GridFilterInputValue,
	GridFilterOperator,
} from "@mui/x-data-grid-premium";
// Bear in mind there are also numeric operators for those columns.

// The logic for these custom filters is actually contained in the ServerPaginatedGrid for most cases
// buildQuery method - as they must translate queries into Lucene syntax to be processed on the server
// As such these exist for two reasons: one to actually get these filter options presented to the user
// and two - to filter in situations where the ClientDataGrid is used.

const doesNotEqualFilter: GridFilterOperator = {
	label: "Does not equal",
	value: "does not equal",
	getApplyFilterFn: (filterItem) => {
		if (!filterItem.field || !filterItem.value || !filterItem.operator) {
			return null;
		}
		return (params) => params[filterItem.field] !== filterItem.value;
	},
	InputComponent: GridFilterInputValue,
};

export const doesNotContainFilter: GridFilterOperator = {
	label: "does not contain",
	value: "does not contain",
	getApplyFilterFn: (filterItem) => {
		if (!filterItem.field || !filterItem.value) {
			return null;
		}

		return (params: GridCellParams) => {
			const cellValue = params[filterItem.field as keyof GridCellParams];
			if (typeof cellValue === "string") {
				return !cellValue.includes(filterItem.value as string);
			}
			return false; // If cell value is not a string, the filter does not apply
		};
	},
	InputComponent: GridFilterInputValue,
};

export const standardFilters: GridFilterOperator[] = [
	...getGridStringOperators().filter(({ value }) =>
		["equals", "contains"].includes(value),
	),
	doesNotEqualFilter,
	doesNotContainFilter,
];

export const equalsOnly: GridFilterOperator[] = [
	...getGridStringOperators().filter(({ value }) => ["equals"].includes(value)),
	doesNotEqualFilter,
];

export const equalsSingular: GridFilterOperator[] = [
	...getGridStringOperators().filter(({ value }) => ["equals"].includes(value)),
];
export const containsOnly: GridFilterOperator[] = [
	...getGridStringOperators().filter(({ value }) =>
		["contains"].includes(value),
	),
	doesNotContainFilter,
];

// For more exact numeric values
export const numericFilters: GridFilterOperator[] = [
	...getGridNumericOperators().filter((operator) =>
		["<=", ">=", "<", ">", "=", "!="].includes(operator.value),
	),
	betweenFilterOperator,
];

// For durations, which are shown in days and don't need the same precision.
export const durationFilters: GridFilterOperator[] = [
	...getGridNumericOperators().filter((operator) =>
		["<", ">"].includes(operator.value),
	),
	betweenFilterOperator,
];

export const isOnly: GridFilterOperator[] = [
	...getGridSingleSelectOperators().filter(({ value }) =>
		["is"].includes(value),
	),
];
