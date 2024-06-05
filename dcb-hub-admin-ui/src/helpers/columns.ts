import { standardFilters } from "./filters";

// Handles standard columns so we don't have to re-declare them everywhere

export const standardRefValueMappingColumns = [
	{
		field: "fromCategory",
		headerName: "Category",
		minWidth: 50,
		flex: 0.5,
		standardFilters,
	},
	{
		field: "fromContext",
		headerName: "From context",
		minWidth: 50,
		flex: 0.5,
		standardFilters,
	},
	{
		field: "fromValue",
		headerName: "From value",
		minWidth: 50,
		flex: 0.4,
		standardFilters,
	},
	{
		field: "toContext",
		headerName: "To context",
		minWidth: 50,
		flex: 0.5,
		standardFilters,
	},
	{
		field: "toValue",
		headerName: "To value",
		minWidth: 50,
		flex: 0.5,
		standardFilters,
		valueGetter: (params: { row: { toValue: string } }) => params.row.toValue,
	},
];

export const standardNumRangeMappingColumns = [
	{
		field: "domain",
		headerName: "Category",
		minWidth: 50,
		flex: 0.5,
		standardFilters,
	},
	{
		field: "context",
		headerName: "From context",
		minWidth: 50,
		flex: 0.5,
		standardFilters,
	},
	{
		field: "lowerBound",
		headerName: "Lower bound",
		minWidth: 50,
		flex: 0.4,
		standardFilters,
	},
	{
		field: "upperBound",
		headerName: "Upper bound",
		minWidth: 50,
		flex: 0.4,
		standardFilters,
	},
	{
		field: "targetContext",
		headerName: "To context",
		minWidth: 50,
		flex: 0.5,
		standardFilters,
	},
	{
		field: "mappedValue",
		headerName: "Mapped value",
		minWidth: 50,
		flex: 0.5,
		standardFilters,
	},
];
