import { Box, MenuItem } from "@mui/material";
import {
	GridToolbarColumnsButton,
	GridToolbarContainer,
	GridToolbarDensitySelector,
	GridToolbarExportContainer,
	GridToolbarFilterButton,
	GridToolbarQuickFilter,
} from "@mui/x-data-grid-pro";
import { useTranslation } from "next-i18next";

interface ExportToolbarProps {
	handleExport: (fileType: string) => Promise<void>;
	allDataLoading: boolean;
}
export default function ExportToolbar({
	handleExport,
	allDataLoading,
}: ExportToolbarProps) {
	const { t } = useTranslation();

	return (
		<Box
			sx={{
				p: 0.5,
				pb: 0,
			}}
		>
			<GridToolbarContainer>
				<GridToolbarColumnsButton />
				<GridToolbarFilterButton />
				<GridToolbarDensitySelector />
				<GridToolbarExportContainer>
					<MenuItem
						onClick={() => handleExport("csv")}
						disabled={allDataLoading}
					>
						{t("ui.data_grid.export_all_csv")}
					</MenuItem>
					<MenuItem
						onClick={() => handleExport("tsv")}
						disabled={allDataLoading}
					>
						{t("ui.data_grid.export_all_tsv")}
					</MenuItem>
				</GridToolbarExportContainer>
			</GridToolbarContainer>
			<GridToolbarQuickFilter
				debounceMs={100}
				quickFilterParser={(searchInput: string) =>
					searchInput
						.split(",")
						.map((value) => value.trim())
						.filter((value) => value !== "")
				}
			/>
		</Box>
	);
}
