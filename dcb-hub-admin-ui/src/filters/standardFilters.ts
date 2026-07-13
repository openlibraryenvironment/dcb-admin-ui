import {
	getGridStringOperators,
	GridFilterOperator,
} from "@mui/x-data-grid-premium";
import { doesNotContainFilter } from "./doesNotContainFilter";
import { doesNotEqualFilter } from "./doesNotEqualFilter";

export const standardFilters: GridFilterOperator[] = [
	...getGridStringOperators().filter(({ value }) =>
		["equals", "contains"].includes(value),
	),
	doesNotEqualFilter,
	doesNotContainFilter,
];
