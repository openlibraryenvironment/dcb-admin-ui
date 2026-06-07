import { betweenFilterOperator } from "@filters/rangeFilterOperator";
import {
	getGridNumericOperators,
	GridFilterOperator,
} from "@mui/x-data-grid-premium";

// For durations, which are shown in days and don't need the same precision.
export const durationFilters: GridFilterOperator[] = [
	...getGridNumericOperators().filter((operator) =>
		["<", ">"].includes(operator.value),
	),
	betweenFilterOperator,
];
