import {
	getGridStringOperators,
	GridFilterOperator,
} from "@mui/x-data-grid-premium";
import { doesNotEqualFilter } from "./doesNotEqualFilter";

export const equalsOnly: GridFilterOperator[] = [
	...getGridStringOperators().filter(({ value }) => ["equals"].includes(value)),
	doesNotEqualFilter,
];
