import { equalsOnly } from "@filters/equalsOnly";
import { luceneDateRangeOperators } from "@filters/luceneDateRangeOperators";
import { standardFilters } from "@filters/standardFilters";
import { GridColDef } from "@mui/x-data-grid-premium";
import dayjs from "dayjs";

export const numericRangeMappingColumnsNoCategoryFilter: GridColDef[] = [
	{
		field: "domain",
		headerName: "Category",
		minWidth: 50,
		flex: 0.5,
		filterable: false,
	},
	{
		field: "context",
		headerName: "From context",
		minWidth: 50,
		flex: 0.5,
		filterOperators: standardFilters,
	},
	{
		field: "lowerBound",
		headerName: "Lower bound",
		minWidth: 50,
		flex: 0.4,
		filterOperators: equalsOnly,
	},
	{
		field: "upperBound",
		headerName: "Upper bound",
		minWidth: 50,
		flex: 0.4,
		filterOperators: equalsOnly,
	},
	{
		field: "targetContext",
		headerName: "To context",
		minWidth: 50,
		flex: 0.5,
		filterOperators: standardFilters,
	},
	{
		field: "mappedValue",
		headerName: "Mapped value",
		minWidth: 50,
		flex: 0.5,
		filterOperators: standardFilters,
		editable: true,
	},
	{
		field: "lastImported",
		headerName: "Last imported",
		minWidth: 100,
		flex: 0.5,
		filterOperators: luceneDateRangeOperators,
		type: "dateTime",
		valueGetter: (value: any, row: { lastImported: string }) => {
			return row.lastImported ? new Date(row.lastImported) : null;
		},
		valueFormatter: (value: Date) => {
			return value ? dayjs(value).format("YYYY-MM-DD HH:mm") : "";
		},
	},
];
