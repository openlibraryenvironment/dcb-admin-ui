import { GridColDef } from "@mui/x-data-grid-premium";
import dayjs from "dayjs";
import i18n from "@/i18n";

export const auditColumns: GridColDef[] = [
	{
		field: "auditDate",
		headerName: i18n.t("audit.date"),
		minWidth: 60,
		flex: 0.2,
		editable: false,
		filterable: true,
		sortable: true,
		valueGetter: (value: string, row: { auditDate: string }) => {
			const auditDate = row.auditDate;
			return dayjs(auditDate).format("YYYY-MM-DD HH:mm:ss.SSS");
		},
	},
	{
		field: "briefDescription",
		headerName: i18n.t("audit.description"),
		minWidth: 100,
		flex: 0.4,
	},
	{
		field: "fromStatus",
		headerName: i18n.t("audit.from_status"),
		minWidth: 50,
		flex: 0.25,
	},
	{
		field: "toStatus",
		headerName: i18n.t("audit.to_status"),
		minWidth: 50,
		flex: 0.25,
	},
];
