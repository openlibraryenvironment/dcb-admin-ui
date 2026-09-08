import { betweenFilterOperator } from "@filters/rangeFilterOperator";
import {
	getGridNumericOperators,
	GridFilterOperator,
} from "@mui/x-data-grid-premium";

// For more exact numeric values

export const numericFilters: GridFilterOperator[] = [
	...getGridNumericOperators().filter((operator) =>
		["<=", ">=", "<", ">", "=", "!="].includes(operator.value),
	),
	betweenFilterOperator,
];
