import {
	DateRangeFilterInput,
	SingleDateFilterInput,
} from "@components/DataGrid/components/DateTimeRangeFilter";
import { getGridDateOperators } from "@mui/x-data-grid-premium";

// Defined as such, so that we know to translate the input into a format the backend will understand
export const luceneDateRangeOperators = [
	{
		label: "Between",
		value: "luceneDateRange",
		getApplyFilterFn: () => null,
		InputComponent: DateRangeFilterInput,
	},
	{
		label: "On or after",
		value: "onOrAfter",
		getApplyFilterFn: () => null,
		InputComponent: SingleDateFilterInput,
	},
	{
		label: "On or before",
		value: "onOrBefore",
		getApplyFilterFn: () => null,
		InputComponent: SingleDateFilterInput,
	},
	{
		label: "Last 30 Days",
		value: "last30Days",
		getApplyFilterFn: () => null,
	},
	{
		label: "Last 90 Days",
		value: "last90Days",
		getApplyFilterFn: () => null,
	},
	// Need to see which operators we actually want. Might be scope to include "is" as well.
	...getGridDateOperators().filter(
		(op) =>
			![
				"is",
				"not",
				"after",
				"onOrAfter",
				"before",
				"onOrBefore",
				"isEmpty",
				"isNotEmpty",
			].includes(op.value),
	),
];
