import { useState } from "react";
import { useTranslation } from "react-i18next";
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

import DataGrid from "@components/DataGrid/DataGrid";
import { standardPatronRequestColumns } from "@columns/getPatronRequestColumns";
import { cleanupPatronRequestVisibility } from "@columns/columnVisibility/cleanupPatronRequestVisibility";
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
						<Stack direction="row" spacing={1} alignItems="center">
							<LinearProgress
								variant="determinate"
								value={progress}
								color={isCleaning ? "primary" : "success"}
								aria-labelledby="progressOfCleanup"
								sx={{ flexGrow: 1 }}
							/>
							{isCleaning && (
								<Typography
									variant="body2"
									color="secondary"
									sx={{ minWidth: 50, textAlign: "right" }}
								>
									{processed} / {total}
								</Typography>
							)}
						</Stack>

						{successRows?.length > 0 && (
							<Accordion
								expanded={isSuccessRowsExpanded}
								onChange={() =>
									setIsSuccessRowsExpanded(!isSuccessRowsExpanded)
								}
								sx={{ mt: 2 }}
							>
								<AccordionSummary
									expandIcon={<ExpandMore />}
									aria-controls="success-rows-content"
									id="success-rows-header"
								>
									<Stack direction="row" spacing={1} alignItems="center">
										<CheckCircleOutline color="success" />
										<Typography variant="h3" sx={{ fontWeight: "bold" }}>
											{t("ui.data_grid.success_count")} {successRows.length}
										</Typography>
									</Stack>
								</AccordionSummary>
								<AccordionDetails>
									<DataGrid
										identifier="cleanupSuccessGrid"
										type="successCleanupRequests"
										columns={standardPatronRequestColumns}
										columnVisibilityModel={cleanupPatronRequestVisibility}
										rows={successRows}
										loading={false}
										checkboxSelection={false}
										disableAggregation
										disableRowGrouping
										disablePivoting
										disableHoverInteractions={false}
										pagination={true}
										paginationMode="client"
										paginationModel={{ page: 0, pageSize: 5 }}
										sortingMode="client"
										filterMode="client"
										rowModesModel={{}}
										listViewEnabled={false}
										pivotingEnabled={false}
										toolbarVisible={false}
										scrollbarVisible={true}
										noResultsText=""
										searchText=""
									/>
								</AccordionDetails>
							</Accordion>
						)}
					</Stack>

					{errorRows?.length > 0 && (
						<Accordion
							expanded={isErrorRowsExpanded}
							onChange={() => setIsErrorRowsExpanded(!isErrorRowsExpanded)}
							sx={{ mt: 2 }}
						>
							<AccordionSummary
								expandIcon={<ExpandMore />}
								aria-controls="error-rows-content"
								id="error-rows-header"
							>
								<Stack direction="row" spacing={1} alignItems="center">
									<ErrorOutline color="error" />
									<Typography variant="h3" sx={{ fontWeight: "bold" }}>
										{t("ui.data_grid.error_count")} {errorRows.length}
									</Typography>
								</Stack>
							</AccordionSummary>
							<AccordionDetails>
								<DataGrid
									identifier="cleanupErrorGrid"
									type="errorCleanupRequests"
									columns={standardPatronRequestColumns}
									columnVisibilityModel={cleanupPatronRequestVisibility}
									rows={errorRows}
									loading={false}
									checkboxSelection={false}
									disableAggregation
									disableRowGrouping
									disablePivoting
									disableHoverInteractions={false}
									pagination={true}
									paginationMode="client"
									paginationModel={{ page: 0, pageSize: 5 }}
									sortingMode="client"
									filterMode="client"
									rowModesModel={{}}
									listViewEnabled={false}
									pivotingEnabled={false}
									toolbarVisible={false}
									scrollbarVisible={true}
									noResultsText=""
									searchText=""
								/>
							</AccordionDetails>
						</Accordion>
					)}

					{skippedRows?.length > 0 && (
						<Accordion
							expanded={isSkippedRowsExpanded}
							onChange={() => setIsSkippedRowsExpanded(!isSkippedRowsExpanded)}
							sx={{ mt: 2 }}
						>
							<AccordionSummary
								expandIcon={<ExpandMore />}
								aria-controls="skipped-rows-content"
								id="skipped-rows-header"
							>
								<Stack direction="row" spacing={1} alignItems="center">
									<WarningAmber color="warning" />
									<Typography variant="h3" sx={{ fontWeight: "bold" }}>
										{t("ui.data_grid.skipped_count")} {skippedRows.length}
									</Typography>
								</Stack>
							</AccordionSummary>
							<AccordionDetails>
								<DataGrid
									identifier="cleanupSkippedGrid"
									type="skippedCleanupRequests"
									columns={standardPatronRequestColumns}
									columnVisibilityModel={cleanupPatronRequestVisibility}
									rows={skippedRows}
									loading={false}
									checkboxSelection={false}
									disableAggregation
									disableRowGrouping
									disablePivoting
									disableHoverInteractions={false}
									pagination={true}
									paginationMode="client"
									paginationModel={{ page: 0, pageSize: 5 }}
									sortingMode="client"
									filterMode="client"
									rowModesModel={{}}
									listViewEnabled={false}
									pivotingEnabled={false}
									toolbarVisible={false}
									scrollbarVisible={true}
									noResultsText=""
									searchText=""
								/>
							</AccordionDetails>
						</Accordion>
					)}
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
