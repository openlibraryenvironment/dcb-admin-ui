import {
	getGridStringOperators,
	GridCellParams,
	GridFilterInputValue,
	GridFilterOperator,
} from "@mui/x-data-grid-pro";
// Bear in mind there are also numeric operators for those columns.

// The logic for these custom filters is actually contained in the ServerPaginatedGrid for most cases
// buildQuery method - as they must translate queries into Lucene syntax to be processed on the server
// As such these exist for two reasons: one to actually get these filter options presented to the user
// and two - to filter in situations where the ClientDataGrid is used.

const doesNotEqualFilter: GridFilterOperator = {
	label: "does not equal",
	value: "does not equal",
	getApplyFilterFn: (filterItem) => {
		if (!filterItem.field || !filterItem.value || !filterItem.operator) {
			return null;
		}
		return (params) => params[filterItem.field] !== filterItem.value;
	},
	InputComponent: GridFilterInputValue,
};

const doesNotContainFilter: GridFilterOperator = {
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

export const standardFilters = [
	...getGridStringOperators().filter(({ value }) =>
		["equals", "contains"].includes(value),
	),
	doesNotEqualFilter,
	doesNotContainFilter,
];

export const equalsOnly = [
	...getGridStringOperators().filter(({ value }) => ["equals"].includes(value)),
	doesNotEqualFilter,
];

export const containsOnly = [
	...getGridStringOperators().filter(({ value }) =>
		["contains"].includes(value),
	),
	doesNotContainFilter,
];
