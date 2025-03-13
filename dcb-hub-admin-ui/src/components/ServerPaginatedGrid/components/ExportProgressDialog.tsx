import {
	Box,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	LinearProgress,
	Typography,
} from "@mui/material";
import { useTranslation } from "next-i18next";

type ExportProgressProps = {
	open: boolean;
	progress: number;
	totalRecords: number;
	// onCancel: any;
};
export const ExportProgressDialog = ({
	open,
	progress,
	totalRecords,
	// onCancel,
}: ExportProgressProps) => {
	const { t } = useTranslation();

	return (
		<Dialog open={open} fullWidth>
			<DialogTitle variant="modalTitle">
				{t("ui.data_grid.export_modal_title")}
			</DialogTitle>
			<DialogContent>
				<Box sx={{ width: "100%", mb: 2 }}>
					<Typography variant="body1" color="text.secondary" align="center">
						{t("ui.data_grid.complete", { percentage: progress + "%" })}
					</Typography>
					<LinearProgress variant="determinate" value={progress} />
				</Box>
				<Typography variant="body1">
					{t("ui.data_grid.exporting_records", { count: totalRecords })}
				</Typography>
			</DialogContent>
			<DialogActions></DialogActions>
		</Dialog>
	);
};
