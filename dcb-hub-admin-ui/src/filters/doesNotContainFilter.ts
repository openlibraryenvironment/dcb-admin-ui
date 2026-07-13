import {
	GridCellParams,
	GridFilterInputValue,
	GridFilterOperator,
} from "@mui/x-data-grid-premium";

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
