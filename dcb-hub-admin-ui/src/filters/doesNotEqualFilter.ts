import {
	GridFilterInputValue,
	GridFilterOperator,
} from "@mui/x-data-grid-premium";

export const doesNotEqualFilter: GridFilterOperator = {
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
