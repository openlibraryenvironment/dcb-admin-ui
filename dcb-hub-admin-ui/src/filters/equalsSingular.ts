import {
	getGridStringOperators,
	GridFilterOperator,
} from "@mui/x-data-grid-premium";

export const equalsSingular: GridFilterOperator[] = [
	...getGridStringOperators().filter(({ value }) => ["equals"].includes(value)),
];
