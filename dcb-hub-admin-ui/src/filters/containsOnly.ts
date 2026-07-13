import {
	getGridStringOperators,
	GridFilterOperator,
} from "@mui/x-data-grid-premium";
import { doesNotContainFilter } from "./doesNotContainFilter";

export const containsOnly: GridFilterOperator[] = [
	...getGridStringOperators().filter(({ value }) =>
		["contains"].includes(value),
	),
	doesNotContainFilter,
];
