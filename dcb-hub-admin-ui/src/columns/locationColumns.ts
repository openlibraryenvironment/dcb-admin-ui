import dayjs from "dayjs";
import { GridColDef } from "@mui/x-data-grid-premium";
import { luceneDateRangeOperators } from "@filters/luceneDateRangeOperators";
import { equalsOnly } from "@filters/equalsOnly";
import { standardFilters } from "@filters/standardFilters";
import type { TFunction } from "i18next";

export const getDefaultLocationColumns = (t: TFunction): GridColDef[] => [
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
		headerName: t("locations.new.pickup_status"),
		minWidth: 50,
		flex: 0.4,
		filterOperators: equalsOnly,
		valueFormatter: (value: boolean) => {
			if (value === true) {
				return t("consortium.settings.enabled");
			} else if (value === false) {
				return t("consortium.settings.disabled");
			} else {
				return t("locations.new.pickup_not_set");
			}
		},
	},
	{
		field: "isEnabledForPickupAnywhere",
		headerName: t("locations.new.pickup_anywhere_status"),
		minWidth: 50,
		flex: 0.4,
		filterOperators: equalsOnly,
		valueFormatter: (value: boolean) => {
			if (value === true) {
				return t("consortium.settings.enabled");
			} else if (value === false) {
				return t("consortium.settings.disabled");
			} else {
				return t("locations.new.pickup_not_set");
			}
		},
	},
	{
		field: "localId",
		headerName: t("locations.local_id"),
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
