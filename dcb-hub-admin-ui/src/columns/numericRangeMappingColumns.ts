import { dateTimeRangeOperators } from "@filters/dateTimeRangeOperators";
import { equalsOnly } from "@filters/equalsOnly";
import { standardFilters } from "@filters/standardFilters";
import { GridColDef } from "@mui/x-data-grid-premium";
import dayjs from "dayjs";
export const standardNumRangeMappingColumns: GridColDef[] = [
	{
		field: "domain",
		headerName: "Category",
		minWidth: 50,
		flex: 0.5,
		filterOperators: standardFilters,
	},
	{
		// Filterable because the server can filter on it: processGridFilterModel
		// builds a field-agnostic `field:value` Lucene clause, and Upload.tsx
		// already queries `fromContext:` directly. Without it the consortium-wide
		// mappings grid could not be narrowed to one library at all - so there was
		// no way to export one library's mappings from it.
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
		editable: true,
		filterOperators: standardFilters,
	},
	{
		field: "lastImported",
		headerName: "Last imported",
		minWidth: 100,
		flex: 0.5,
		filterOperators: dateTimeRangeOperators,
		type: "dateTime",
		valueGetter: (value: any, row: { lastImported: string }) => {
			return row.lastImported ? new Date(row.lastImported) : null;
		},
		valueFormatter: (value: Date) => {
			return value ? dayjs(value).format("YYYY-MM-DD HH:mm") : "";
		},
	},
];
