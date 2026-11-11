import dayjs from "dayjs";
import type { TFunction } from "i18next";
import {
	GridColDef,
	GRID_DETAIL_PANEL_TOGGLE_COL_DEF,
} from "@mui/x-data-grid-premium";
import { DetailPanelToggle } from "@components/MasterDetail/components/DetailPanelToggle/DetailPanelToggle";
import DetailPanelHeader from "@components/MasterDetail/components/DetailPanelHeader/DetailPanelHeader";

export const getItemColumns = (t: TFunction): GridColDef[] => [
	{
		...GRID_DETAIL_PANEL_TOGGLE_COL_DEF,
		headerName: t("ui.data_grid.master_detail"),
		renderCell: (params) => <DetailPanelToggle id={params.id} />,
		renderHeader: () => <DetailPanelHeader />,
	},
	{
		field: "agencyCode",
		headerName: t("agencies.code"),
		flex: 0.3,
		editable: false,
		filterable: true,
		sortable: true,
		valueGetter: (value: any, row: { agency: { code: string } }) =>
			row?.agency?.code ?? "-",
	},
	{
		field: "id",
		headerName: t("requesting.item_id"),
		minWidth: 50,
		flex: 0.3,
		editable: false,
		filterable: true,
		sortable: true,
	},
	{
		field: "status",
		headerName: t("ui.common.status"),
		minWidth: 100,
		editable: false,
		filterable: true,
		sortable: true,
		flex: 0.4,
		valueGetter: (value: any, row: { status: { code: string } }) =>
			row?.status?.code,
	},
	{
		field: "isRequestable",
		headerName: t("requesting.requestable"),
		minWidth: 50,
		type: "boolean",
		editable: false,
		filterable: true,
		sortable: true,
		flex: 0.3,
	},
	{
		field: "isSuppressed",
		headerName: t("requesting.suppressed"),
		minWidth: 50,
		type: "boolean",
		editable: false,
		filterable: true,
		sortable: true,
		flex: 0.3,
	},
	{
		field: "holdCount",
		headerName: t("requesting.hold_count"),
		minWidth: 50,
		type: "number",
		editable: false,
		filterable: true,
		sortable: true,
		flex: 0.3,
	},
	{
		field: "dueDate",
		headerName: t("requesting.date_due"),
		minWidth: 100,
		flex: 0.4,
		editable: false,
		filterable: true,
		sortable: true,
		valueGetter: (value: any, row: { dueDate: string | null }) => {
			const dateDue = row?.dueDate;
			return dateDue ? dayjs(dateDue).format("YYYY-MM-DD") : "-";
		},
	},
	{
		field: "availabilityDate",
		headerName: t("requesting.date_available"),
		minWidth: 100,
		flex: 0.4,
		editable: false,
		filterable: true,
		sortable: true,
		valueGetter: (value: any, row: { availabilityDate: string | null }) => {
			const dateAvailable = row?.availabilityDate;
			return dateAvailable ? dayjs(dateAvailable).format("YYYY-MM-DD") : "-";
		},
	},
	{
		field: "canonicalItemType",
		headerName: t("requesting.supplier_type"),
		minWidth: 100,
		editable: false,
		filterable: true,
		sortable: true,
		flex: 0.5,
	},
	// Hidden by default (itemColumnVisibility.ts): what identifies an item at the library holding it
	{ field: "barcode", headerName: t("search.barcode"), minWidth: 140 },
	{
		field: "location",
		headerName: t("patron_request.previous_suppliers.location"),
		minWidth: 160,
		valueGetter: (value: { name?: string; code?: string } | null) =>
			value?.name ?? value?.code ?? "",
	},
	{ field: "callNumber", headerName: t("search.call_no"), minWidth: 140 },
	{
		field: "localItemType",
		headerName: t("patron_request.local_item_type"),
		minWidth: 140,
	},
	{ field: "hostLmsCode", headerName: t("hostlms.code"), minWidth: 140 },
];
