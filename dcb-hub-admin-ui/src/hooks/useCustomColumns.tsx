import { useTranslation } from "next-i18next";
import {
	GRID_DETAIL_PANEL_TOGGLE_COL_DEF,
	GRID_CHECKBOX_SELECTION_COL_DEF,
	GridColDef,
} from "@mui/x-data-grid-premium";
import DetailPanelHeader from "@components/MasterDetail/components/DetailPanelHeader/DetailPanelHeader";
import { DetailPanelToggle } from "@components/MasterDetail/components/DetailPanelToggle/DetailPanelToggle";

// Use this if you want to introduce the master detail and checkbox selection columns together.
export const useCustomColumns = (): GridColDef[] => {
	const { t } = useTranslation();

	return [
		{
			...GRID_DETAIL_PANEL_TOGGLE_COL_DEF,
			headerName: t("ui.data_grid.master_detail"),
			renderCell: (params) => (
				<DetailPanelToggle id={params.id} value={params.value} />
			),
			renderHeader: () => <DetailPanelHeader />,
		},
		{
			...GRID_CHECKBOX_SELECTION_COL_DEF,
		},
	];
};
