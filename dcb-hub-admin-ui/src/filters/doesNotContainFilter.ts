import {
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
		// Case-insensitive, as MUI's own "contains" is
		const term = String(filterItem.value).toLowerCase();
		return (value) =>
			!String(value ?? "")
				.toLowerCase()
				.includes(term);
	},
	InputComponent: GridFilterInputValue,
};
