import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
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
	ExpandMore,
	WarningAmber,
} from "@mui/icons-material";
import { useTranslation } from "next-i18next";
import { ClientDataGrid } from "@components/ClientDataGrid";
import {
	cleanupPatronRequestVisibility,
	standardPatronRequestColumns,
} from "src/helpers/DataGrid/columns";
import { useState } from "react";

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

	const [isSuccessRowsExpanded, setIsSuccessRowsExpanded] = useState(false);
	const [isErrorRowsExpanded, setIsErrorRowsExpanded] = useState(false);
	const [isSkippedRowsExpanded, setIsSkippedRowsExpanded] = useState(false);

	return (
		<Dialog open={open} fullWidth maxWidth="sm">
			<DialogTitle variant="modalTitle">
				{isCleaning
					? t("patron_requests.cleanup_in_progress")
					: t("patron_requests.cleanup_complete")}
			</DialogTitle>
			<DialogContent>
				<Stack direction="column" spacing={1}>
					<Stack direction="column" spacing={1}>
						<Stack direction="row" spacing={1}>
							<LinearProgress
								variant="determinate"
								value={progress}
								color={isCleaning ? "primary" : "success"}
								aria-labelledby="progressOfCleanup"
								// sx={{ height: 10, borderRadius: 5 }}
							/>
							{isCleaning ? (
								<Typography
									variant="body2"
									color="secondary"
									align="right"
									sx={{ mt: 1 }}
								>
									{processed} / {total}
								</Typography>
							) : null}
						</Stack>
						{successRows?.length > 0 ? (
							<Stack direction="column" spacing={1}>
								<Accordion
									expanded={isSuccessRowsExpanded}
									onChange={() =>
										setIsSuccessRowsExpanded(!isSuccessRowsExpanded)
									}
									sx={{ mt: 2 }}
								>
									<AccordionSummary
										expandIcon={<ExpandMore />}
										aria-controls="success-rows-show-content"
										id="success-rows-show-content"
									>
										<Stack direction={"row"} spacing={1}>
											<CheckCircleOutline color="success" />
											<Typography variant="h3" sx={{ fontWeight: "bold" }}>
												{t("ui.data_grid.success_count")}
												{successRows?.length}
											</Typography>
										</Stack>
									</AccordionSummary>
									<AccordionDetails>
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
									</AccordionDetails>
								</Accordion>
							</Stack>
						) : null}
					</Stack>
					{errorRows?.length > 0 ? (
						<Stack direction="column" spacing={1}>
							<Accordion
								expanded={isErrorRowsExpanded}
								onChange={() => setIsErrorRowsExpanded(!isErrorRowsExpanded)}
								sx={{ mt: 2 }}
							>
								<AccordionSummary
									expandIcon={<ExpandMore />}
									aria-controls="error-rows-show-content"
									id="error-rows-show-content"
								>
									<Stack direction={"row"} spacing={1}>
										<ErrorOutline color="error" />
										<Typography variant="h3" sx={{ fontWeight: "bold" }}>
											{t("ui.data_grid.error_count")}
											{errorRows?.length}
										</Typography>
									</Stack>
								</AccordionSummary>
								<AccordionDetails>
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
								</AccordionDetails>
							</Accordion>
						</Stack>
					) : null}
					{skippedRows?.length > 0 ? (
						<Stack direction={"column"} spacing={1}>
							<Accordion
								expanded={isSkippedRowsExpanded}
								onChange={() =>
									setIsSkippedRowsExpanded(!isSkippedRowsExpanded)
								}
								sx={{ mt: 2 }}
							>
								<AccordionSummary
									expandIcon={<ExpandMore />}
									aria-controls="skipped-rows-show-content"
									id="skipped-rows-show-content"
								>
									<Stack direction={"row"} spacing={1}>
										<WarningAmber color="warning" />
										<Typography variant="h3" sx={{ fontWeight: "bold" }}>
											{t("ui.data_grid.skipped_count")}
											{skippedRows?.length}
										</Typography>
									</Stack>
								</AccordionSummary>
								<AccordionDetails>
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
									/>
								</AccordionDetails>
							</Accordion>
						</Stack>
					) : null}
				</Stack>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose} disabled={isCleaning} variant="contained">
					{t("ui.data_grid.close")}
				</Button>
			</DialogActions>
		</Dialog>
	);
};
