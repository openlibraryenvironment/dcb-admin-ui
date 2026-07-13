import {
	getGridSingleSelectOperators,
	GridFilterOperator,
} from "@mui/x-data-grid-premium";

export const isOnly: GridFilterOperator[] = [
	...getGridSingleSelectOperators().filter(({ value }) =>
		["is"].includes(value),
	),
];
