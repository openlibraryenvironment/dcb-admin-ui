import dayjs from "dayjs";
import { GridColDef } from "@mui/x-data-grid-premium";
import { luceneDateRangeOperators } from "@filters/luceneDateRangeOperators";
import { equalsOnly } from "@filters/equalsOnly";
import { standardFilters } from "@filters/standardFilters";
import i18n from "@/i18n";

export const defaultLocationColumns: GridColDef[] = [
	{
		field: "agencyCode",
		headerName: "Agency code",
		minWidth: 150,
		flex: 0.6,
		filterable: false,
		sortable: false,
		valueGetter: (value, row: { agency: { code: string } }) =>
			row?.agency?.code,
	},
	{
		field: "hostSystemName",
		headerName: "Host LMS name",
		minWidth: 150,
		flex: 0.6,
		filterable: false,
		sortable: false,
		valueGetter: (value, row: { hostSystem: { name: string } }) =>
			row?.hostSystem?.name,
	},
	{
		field: "name",
		headerName: "Location name",
		minWidth: 150,
		flex: 0.6,
		editable: true,
		filterOperators: standardFilters,
	},
	{
		field: "printLabel",
		headerName: "Print label",
		minWidth: 150,
		flex: 0.6,
		editable: true,
		filterOperators: standardFilters,
	},
	{
		field: "code",
		headerName: "Location code",
		minWidth: 50,
		flex: 0.4,
		filterOperators: standardFilters,
	},
	{
		field: "isPickup",
		headerName: i18n.t("locations.new.pickup_status"),
		minWidth: 50,
		flex: 0.4,
		filterOperators: equalsOnly,
		valueFormatter: (value: boolean) => {
			if (value === true) {
				return i18n.t("consortium.settings.enabled");
			} else if (value === false) {
				return i18n.t("consortium.settings.disabled");
			} else {
				return i18n.t("details.location_pickup_not_set");
			}
		},
	},
	{
		field: "isEnabledForPickupAnywhere",
		headerName: i18n.t("locations.new.pickup_anywhere_status"),
		minWidth: 50,
		flex: 0.4,
		filterOperators: equalsOnly,
		valueFormatter: (value: boolean) => {
			if (value === true) {
				return i18n.t("consortium.settings.enabled");
			} else if (value === false) {
				return i18n.t("consortium.settings.disabled");
			} else {
				return i18n.t("details.location_pickup_not_set");
			}
		},
	},
	{
		field: "localId",
		headerName: i18n.t("details.local_id"),
		minWidth: 50,
		flex: 0.8,
		filterOperators: equalsOnly,
		editable: true,
	},
	{
		field: "id",
		headerName: "Location UUID",
		minWidth: 50,
		flex: 0.8,
		filterOperators: equalsOnly,
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
