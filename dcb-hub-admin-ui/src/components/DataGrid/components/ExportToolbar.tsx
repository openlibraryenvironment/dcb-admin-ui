import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
	Button,
	CircularProgress,
	ListItemIcon,
	ListItemText,
	Menu,
	MenuItem,
	Tooltip,
} from "@mui/material";
import {
	ChecklistRounded,
	CleaningServicesRounded,
	FileDownloadOutlined,
	PrintOutlined,
} from "@mui/icons-material";
import {
	GridToolbarContainer,
	GridToolbarColumnsButton,
	GridToolbarFilterButton,
	GridToolbarExportContainer,
	useGridApiContext,
	useGridSelector,
	gridFilterModelSelector,
} from "@mui/x-data-grid-premium";

import { generateFilterDescription } from "@helpers/dataGrid/utilities";

interface ExportToolbarProps {
	handleExport?: (fileType: string, exportMode: string) => Promise<void>;
	allDataLoading?: boolean;
	type?: string;
	onCleanup?: () => void;
	selectionCount?: number;
}

export default function ExportToolbar({
	handleExport,
	allDataLoading,
	type,
	onCleanup,
	selectionCount = 0,
}: ExportToolbarProps) {
	const { t } = useTranslation();
	const apiRef = useGridApiContext();
	const filterModel = useGridSelector(apiRef, gridFilterModelSelector);
	const filterTooltipText = generateFilterDescription(filterModel);

	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const open = Boolean(anchorEl);

	const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		setAnchorEl(event.currentTarget);
	};

	const handleMenuClose = () => {
		setAnchorEl(null);
	};

	const onExportClick = (fileType: string, exportMode: string) => {
		if (handleExport) {
			handleExport(fileType, exportMode);
		} else {
			console.warn("Export function is not available for this grid.");
		}
	};

	const handleCleanupClick = () => {
		if (onCleanup) {
			onCleanup();
		}
		handleMenuClose();
	};

	return (
		<GridToolbarContainer>
			{/* UPGRADE: Replaced manual Triggers with native V8 Toolbar Buttons */}
			<GridToolbarColumnsButton />

			<Tooltip title={filterTooltipText}>
				<span>
					<GridToolbarFilterButton />
				</span>
			</Tooltip>

			<GridToolbarExportContainer>
				{/* UPGRADE: Grouped conditional rendering cleanly via fragments */}
				{type !== "patronRequests" && (
					<>
						<MenuItem
							onClick={() => onExportClick("csv", "default")}
							disabled={allDataLoading}
						>
							<ListItemIcon>
								{allDataLoading ? (
									<CircularProgress size={20} />
								) : (
									<FileDownloadOutlined />
								)}
							</ListItemIcon>
							<ListItemText>{t("ui.data_grid.export_all_csv")}</ListItemText>
						</MenuItem>
						<MenuItem
							onClick={() => onExportClick("tsv", "default")}
							disabled={allDataLoading}
						>
							<ListItemIcon>
								<FileDownloadOutlined />
							</ListItemIcon>
							<ListItemText>{t("ui.data_grid.export_all_tsv")}</ListItemText>
						</MenuItem>
					</>
				)}

				{type === "patronRequests" && (
					<>
						<MenuItem
							onClick={() => onExportClick("csv", "all")}
							disabled={allDataLoading}
						>
							<ListItemIcon>
								<FileDownloadOutlined />
							</ListItemIcon>
							<ListItemText>{t("ui.data_grid.export.all")}</ListItemText>
						</MenuItem>
						<MenuItem
							onClick={() => onExportClick("csv", "filtered")}
							disabled={allDataLoading}
						>
							<ListItemIcon>
								<FileDownloadOutlined />
							</ListItemIcon>
							<ListItemText>{t("ui.data_grid.export.filtered")}</ListItemText>
						</MenuItem>
						<MenuItem
							onClick={() => onExportClick("csv", "current")}
							disabled={allDataLoading}
						>
							<ListItemIcon>
								<FileDownloadOutlined />
							</ListItemIcon>
							<ListItemText>{t("ui.data_grid.export.current")}</ListItemText>
						</MenuItem>
					</>
				)}

				{/* Global Export Options */}
				<MenuItem
					onClick={() => onExportClick("csv", "print")}
					disabled={allDataLoading}
				>
					<ListItemIcon>
						<PrintOutlined />
					</ListItemIcon>
					<ListItemText>{t("ui.data_grid.export.print")}</ListItemText>
				</MenuItem>
			</GridToolbarExportContainer>

			{type === "patronRequests" && (
				<>
					<Button
						id="actions-button"
						aria-controls={open ? "actions-menu" : undefined}
						aria-haspopup="true"
						aria-expanded={open ? "true" : undefined}
						variant="text"
						size="small"
						onClick={handleMenuClick}
						startIcon={<ChecklistRounded />}
					>
						{t("ui.data_grid.actions", "Actions")}
						{selectionCount > 0 && ` (${selectionCount})`}
					</Button>
					<Menu
						id="actions-menu"
						anchorEl={anchorEl}
						open={open}
						onClose={handleMenuClose}
						slotProps={{ list: { "aria-labelledby": "actions-button" } }}
					>
						<MenuItem onClick={handleCleanupClick}>
							<ListItemIcon>
								<CleaningServicesRounded fontSize="small" />
							</ListItemIcon>
							<ListItemText>
								{t("ui.data_grid.cleanup.selected", {
									count: selectionCount,
								})}
							</ListItemText>
						</MenuItem>
					</Menu>
				</>
			)}
		</GridToolbarContainer>
	);
}
