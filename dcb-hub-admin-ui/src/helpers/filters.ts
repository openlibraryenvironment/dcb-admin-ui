import { getGridStringOperators } from "@mui/x-data-grid-pro";

export const standardFilters = getGridStringOperators().filter(({ value }) =>
	[
		"equals",
		"contains" /* add more over time as we build in support for them */,
	].includes(value),
);

export const equalsOnly = getGridStringOperators().filter(({ value }) =>
	["equals"].includes(value),
);

export const containsOnly = getGridStringOperators().filter(({ value }) =>
	["contains"].includes(value),
);
