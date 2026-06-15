import dayjs from "dayjs";
import i18n from "@/i18n";
import { GridColDef } from "@mui/x-data-grid-premium";
import { dateTimeRangeOperators } from "@filters/dateTimeRangeOperators";
import { standardFilters } from "@filters/standardFilters";
import { equalsOnly } from "@filters/equalsOnly";

export const standardBibColumns: GridColDef[] = [
	{
		field: "title",
		headerName: i18n.t("bibs.title_actual"),
		minWidth: 150,
		flex: 1,
		sortable: false,
		filterOperators: standardFilters,
	},
	{
		field: "clusterRecordId",
		headerName: i18n.t("bibs.cluster_uuid"),
		minWidth: 50,
		flex: 0.5,
		sortable: false,
		filterOperators: equalsOnly,
		filterable: false,
		valueGetter: (value: any, row: { contributesTo: { id: string } }) =>
			row?.contributesTo?.id,
	},
	{
		field: "sourceRecordId",
		headerName: i18n.t("bibs.source_record_id"),
		minWidth: 50,
		sortable: false,
		filterOperators: standardFilters,
		flex: 0.5,
	},
	{
		field: "sourceSystemId",
		headerName: i18n.t("bibs.source_system_id"),
		minWidth: 50,
		sortable: false,
		filterOperators: equalsOnly,
		flex: 0.5,
	},
	{
		field: "id",
		headerName: i18n.t("bibs.id"),
		minWidth: 100,
		flex: 0.5,
		sortable: false,
		filterOperators: equalsOnly,
	},
	{
		field: "dateUpdated",
		headerName: i18n.t("bibs.date_updated"),
		minWidth: 50,
		flex: 0.6,
		sortable: false,
		filterOperators: dateTimeRangeOperators,
		type: "dateTime",
		valueGetter: (value: any, row: { dateUpdated: string }) => {
			return row.dateUpdated ? new Date(row.dateUpdated) : null;
		},
		valueFormatter: (value: Date) => {
			return value ? dayjs(value).format("YYYY-MM-DD HH:mm") : "";
		},
	},
	{
		field: "processVersion",
		headerName: i18n.t("bibs.process_version"),
		minWidth: 50,
		sortable: false,
		filterOperators: equalsOnly,
		flex: 0.5,
	},
];
