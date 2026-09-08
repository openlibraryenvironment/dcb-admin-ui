import { GridColDef } from "@mui/x-data-grid-premium";
import i18n from "@/i18n";
import dayjs from "dayjs";
import { capitaliseFirstCharacter } from "@helpers/capitaliseFirstCharacter";
import { tableNameToEntityName } from "@helpers/dataChangeLogHelperFunctions";
import {
	renderEntityIdCell,
	renderReferenceUrlCell,
} from "@components/DataChangeLogRenderers/DataChangeLogRenderers";
import { equalsOnly } from "@filters/equalsOnly";
import { standardFilters } from "@filters/standardFilters";
import { containsOnly } from "@filters/containsOnly";

// entity needs its own drop down
export const dataChangeLogColumns: GridColDef[] = [
	{
		field: "timestampLogged",
		headerName: i18n.t("data_change_log.timestamp", "Timestamp"),
		minWidth: 100,
		flex: 0.5,
		filterable: false,
		valueGetter: (val: any, row: any) =>
			dayjs(row.timestampLogged).format("YYYY-MM-DD HH:mm:ss"),
	},
	{
		field: "entityType",
		headerName: i18n.t("data_change_log.entity_type", "Entity"),
		minWidth: 50,
		flex: 0.5,
		filterOperators: containsOnly,
		valueGetter: (val: any, row: any) =>
			capitaliseFirstCharacter(i18n.t(tableNameToEntityName(row?.entityType))),
	},
	{
		field: "entityId",
		headerName: i18n.t("data_change_log.entity_id"),
		minWidth: 100,
		flex: 0.4,
		filterOperators: equalsOnly,
		renderCell: renderEntityIdCell,
	},
	{
		field: "actionInfo",
		headerName: i18n.t("data_change_log.action"),
		minWidth: 50,
		flex: 0.25,
		filterOperators: standardFilters,
	},
	{
		field: "changeCategory",
		headerName: i18n.t("data_change_log.category"),
		minWidth: 50,
		flex: 0.4,
		filterOperators: standardFilters,
	},
	{
		field: "reason",
		headerName: i18n.t("data_change_log.reason"),
		minWidth: 50,
		flex: 0.6,
		filterOperators: standardFilters,
	},
	{
		field: "lastEditedBy",
		headerName: i18n.t("data_change_log.user"),
		minWidth: 50,
		flex: 0.4,
		filterOperators: standardFilters,
	},
	{
		field: "changeReferenceUrl",
		headerName: i18n.t("data_change_log.reference_url"),
		minWidth: 50,
		flex: 0.6,
		filterOperators: standardFilters,
		renderCell: renderReferenceUrlCell,
	},
	{
		field: "id",
		headerName: i18n.t("data_change_log.id"),
		minWidth: 50,
		flex: 0.4,
		filterOperators: equalsOnly,
	},
];
