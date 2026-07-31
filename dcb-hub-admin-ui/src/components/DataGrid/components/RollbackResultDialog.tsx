import { useTranslation } from "react-i18next";
import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	LinearProgress,
	List,
	ListItem,
	Stack,
	Typography,
} from "@mui/material";
import {
	CheckCircleOutlined,
	ErrorOutlined,
	WarningAmber,
} from "@mui/icons-material";

import Link from "@components/Link/Link";

interface RollbackResultDialogProps {
	open: boolean;
	isRollingBack: boolean;
	total: number;
	processed: number;
	successRows: any[];
	errorRows: any[];
	skippedRows: any[];
	onClose: () => void;
}

const RequestIdList = ({ rows }: { rows: any[] }) => (
	<List dense disablePadding sx={{ pl: 4 }}>
		{rows.map((row) => (
			<ListItem key={row.id} disablePadding>
				<Link
					to={`/patronRequests/${row.id}`}
					onClick={(e: React.MouseEvent) => e.stopPropagation()}
				>
					{row.id}
				</Link>
			</ListItem>
		))}
	</List>
);

export const RollbackResultDialog = ({
	open,
	isRollingBack,
	total,
	processed,
	successRows,
	errorRows,
	skippedRows,
	onClose,
}: RollbackResultDialogProps) => {
	const { t } = useTranslation();
	const progress = total > 0 ? (processed / total) * 100 : 100;

	return (
		<Dialog open={open} fullWidth maxWidth="sm">
			<DialogTitle variant="modalTitle">
				{isRollingBack
					? t("patron_requests.rollback_in_progress")
					: t("patron_requests.rollback_complete")}
			</DialogTitle>
			<DialogContent>
				<Stack direction="column" spacing={2}>
					<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
						<LinearProgress
							variant="determinate"
							value={progress}
							color={isRollingBack ? "primary" : "success"}
							aria-label={t("patron_requests.rollback_in_progress")}
							sx={{ flexGrow: 1 }}
						/>
						{isRollingBack && (
							<Typography
								variant="body2"
								color="secondary"
								sx={{ minWidth: 50, textAlign: "right" }}
							>
								{processed} / {total}
							</Typography>
						)}
					</Stack>

					{!isRollingBack && total === 0 && skippedRows.length > 0 && (
						<Typography color="text.secondary">
							{t("patron_requests.rollback_none_eligible")}
						</Typography>
					)}

					{successRows.length > 0 && (
						<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
							<CheckCircleOutlined color="success" />
							<Typography>
								{t("ui.data_grid.success_count")} {successRows.length}
							</Typography>
						</Stack>
					)}

					{errorRows.length > 0 && (
						<Stack direction="column" spacing={0.5}>
							<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
								<ErrorOutlined color="error" />
								<Typography>
									{t("ui.data_grid.error_count")} {errorRows.length}
								</Typography>
							</Stack>
							<RequestIdList rows={errorRows} />
						</Stack>
					)}

					{skippedRows.length > 0 && (
						<Stack direction="column" spacing={0.5}>
							<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
								<WarningAmber color="warning" />
								<Typography>
									{t("ui.data_grid.skipped_count")} {skippedRows.length}
								</Typography>
							</Stack>
							<RequestIdList rows={skippedRows} />
						</Stack>
					)}
				</Stack>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose} disabled={isRollingBack} variant="contained">
					{t("ui.data_grid.close")}
				</Button>
			</DialogActions>
		</Dialog>
	);
};
