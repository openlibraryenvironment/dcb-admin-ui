import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	LinearProgress,
	Stack,
	Typography,
} from "@mui/material";
import {
	CheckCircleOutline,
	ErrorOutline,
	WarningAmber,
} from "@mui/icons-material";
import { useTranslation } from "next-i18next";
import { ClientDataGrid } from "@components/ClientDataGrid";
import {
	cleanupPatronRequestVisibility,
	standardPatronRequestColumns,
} from "src/helpers/DataGrid/columns";

interface CleanupProgressDialogProps {
	open: boolean;
	isCleaning: boolean;
	progress: number;
	total: number;
	processed: number;
	successRows: any[];
	errorRows: any[];
	skippedRows: any[];
	onClose: () => void;
}

// Translation keys and more refinement needed
export const CleanupProgressDialog = ({
	open,
	isCleaning,
	progress,
	total,
	processed,
	successRows,
	errorRows,
	skippedRows,
	onClose,
}: CleanupProgressDialogProps) => {
	const { t } = useTranslation();

	return (
		<Dialog open={open} fullWidth maxWidth="sm">
			<DialogTitle variant="h6">
				{isCleaning
					? t("ui.data_grid.cleanup_in_progress")
					: t("ui.data_grid.cleanup_complete")}
			</DialogTitle>
			<DialogContent>
				<Stack direction="column" spacing={1}>
					<Stack direction="column" spacing={1}>
						<Stack direction="row" spacing={1}>
							<LinearProgress
								variant="determinate"
								value={progress}
								color={isCleaning ? "primary" : "success"}
								sx={{ height: 10, borderRadius: 5 }}
							/>
							<Typography
								variant="body2"
								color="text.secondary"
								align="right"
								sx={{ mt: 1 }}
							>
								{processed} / {total}
							</Typography>
						</Stack>

						<Stack direction="column" spacing={1}>
							<Stack direction={"row"} spacing={1}>
								<CheckCircleOutline color="success" />
								<Typography variant="body1">
									{t("ui.data_grid.success_count", "Successful")}:{" "}
									<strong>{successRows?.length}</strong>
								</Typography>
							</Stack>
							{errorRows?.length > 0 ? (
								<ClientDataGrid
									data={successRows}
									columns={standardPatronRequestColumns}
									columnVisibilityModel={cleanupPatronRequestVisibility}
									coreType="patronRequests"
									type="successCleanupRequests"
									selectable={false}
									disableAggregation
									disableRowGrouping
									operationDataType="patronRequests"
									toolbarVisible="not-visible"
								/>
							) : null}
						</Stack>
					</Stack>
					<Stack direction="column" spacing={1}>
						<Stack direction={"row"} spacing={1}>
							<ErrorOutline color="error" />
							<Typography variant="body1">
								{t("ui.data_grid.error_count", "Failed")}:{" "}
								<strong>{errorRows?.length}</strong>
							</Typography>
						</Stack>
						{errorRows?.length > 0 ? (
							<ClientDataGrid
								data={errorRows}
								columns={standardPatronRequestColumns}
								columnVisibilityModel={cleanupPatronRequestVisibility}
								coreType="patronRequests"
								type="errorCleanupRequests"
								selectable={false}
								disableAggregation
								disableRowGrouping
								operationDataType="patronRequests"
								toolbarVisible="not-visible"
							/>
						) : null}
					</Stack>
					<Stack direction={"column"}>
						<Stack direction={"row"} spacing={1}>
							<WarningAmber color="warning" />
							<Typography variant="body1">
								{t("ui.data_grid.skipped_count", "Not Eligible")}:{" "}
								<strong>{skippedRows?.length}</strong>
							</Typography>
						</Stack>
						{skippedRows?.length > 0 ? (
							<ClientDataGrid
								data={skippedRows}
								columns={standardPatronRequestColumns}
								columnVisibilityModel={cleanupPatronRequestVisibility}
								coreType="patronRequests"
								type="skippedCleanupRequests"
								selectable={false}
								disableAggregation
								disableRowGrouping
								operationDataType="patronRequests"
								toolbarVisible="not-visible"
								autoRowHeight
							/>
						) : null}
					</Stack>
				</Stack>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose} disabled={isCleaning} variant="contained">
					{t("ui.common.close", "Close")}
				</Button>
			</DialogActions>
		</Dialog>
	);
};
