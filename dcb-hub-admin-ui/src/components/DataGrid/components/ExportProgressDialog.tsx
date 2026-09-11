import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	LinearProgress,
	Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";

const TITLE_ID = "export-progress-title";

type ExportProgressProps = {
	open: boolean;
	progress: number;
	totalRecords: number;
	onCancel: () => void;
};
export const ExportProgressDialog = ({
	open,
	progress,
	totalRecords,
	onCancel,
}: ExportProgressProps) => {
	const { t } = useTranslation();

	return (
		<Dialog
			open={open}
			fullWidth
			aria-labelledby={TITLE_ID}
			// Escape cancels, a backdrop click does not: a stray click should not
			// discard an export that has been running for ten minutes.
			onClose={(_event, reason) => {
				if (reason === "escapeKeyDown") onCancel();
			}}
		>
			<DialogTitle id={TITLE_ID} variant="modalTitle">
				{t("ui.data_grid.export_modal_title")}
			</DialogTitle>
			<DialogContent>
				<Box sx={{ width: "100%", mb: 2 }}>
					<Typography
						variant="body1"
						align="center"
						sx={{
							color: "text.secondary",
						}}
					>
						{t("ui.data_grid.complete", { percentage: progress + "%" })}
					</Typography>
					<LinearProgress
						variant="determinate"
						value={progress}
						aria-labelledby={TITLE_ID}
						aria-valuetext={t("ui.data_grid.complete", {
							percentage: progress + "%",
						})}
					/>
				</Box>
				<Typography variant="body1">
					{t("ui.data_grid.exporting_records", { count: totalRecords })}
				</Typography>
			</DialogContent>
			<DialogActions>
				<Button onClick={onCancel}>{t("ui.data_grid.export.cancel")}</Button>
			</DialogActions>
		</Dialog>
	);
};
