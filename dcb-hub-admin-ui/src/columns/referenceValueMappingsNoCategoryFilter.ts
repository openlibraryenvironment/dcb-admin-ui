import { dateTimeRangeOperators } from "@filters/dateTimeRangeOperators";
import { standardFilters } from "@filters/standardFilters";
import { GridColDef } from "@mui/x-data-grid-premium";
import dayjs from "dayjs";

export const referenceValueMappingColumnsNoCategoryFilter: GridColDef[] = [
	{
		field: "fromCategory",
		headerName: "Category",
		minWidth: 50,
		flex: 0.5,
		filterable: false,
		sortable: true,
		editable: false,
	},
	{
		field: "fromContext",
		headerName: "From context",
		minWidth: 50,
		flex: 0.5,
		filterable: false,
		sortable: false,
		editable: false,
	},
	{
		field: "fromValue",
		headerName: "From value",
		minWidth: 50,
		flex: 0.4,
		filterOperators: standardFilters,
		sortable: true,
		editable: false,
	},
	{
		field: "toContext",
		headerName: "To context",
		minWidth: 50,
		flex: 0.5,
		filterable: false,
		sortable: false,
		editable: false,
	},
	{
		field: "toValue",
		headerName: "To value",
		minWidth: 50,
		flex: 0.5,
		filterOperators: standardFilters,
		sortable: true,
		editable: true,
		valueGetter: (value: string, row: { toValue: string }) => row?.toValue,
	},
	{
		field: "lastImported",
		headerName: "Last imported",
		minWidth: 100,
		flex: 0.5,
		sortable: true,
		editable: false,
		filterOperators: dateTimeRangeOperators,
		type: "dateTime",
		valueGetter: (value: any, row: { lastImported: string }) => {
			return row.lastImported ? new Date(row.lastImported) : null;
		},
		valueFormatter: (value: Date) => {
			return value ? dayjs(value).format("YYYY-MM-DD HH:mm") : "";
		},
	},
	{
		field: "toCategory",
		headerName: "To category",
		minWidth: 50,
		flex: 0.5,
		filterOperators: standardFilters,
		editable: true,
		sortable: true,
		valueGetter: (value: string, row: { toCategory: string }) =>
			row?.toCategory,
	},
];
