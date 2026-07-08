import { generateFilterDescription } from "@helpers/dataGrid/utilities";
import {
	ChecklistRounded,
	CleaningServicesRounded,
	FileDownloadOutlined,
	PrintOutlined,
	TuneRounded,
} from "@mui/icons-material";
import {
	Badge,
	Button,
	CircularProgress,
	Divider,
	ListItemIcon,
	ListItemText,
	Menu,
	MenuItem,
	Tooltip,
} from "@mui/material";
import {
	ColumnsPanelTrigger,
	FilterPanelTrigger,
	GridFilterListIcon,
	gridFilterModelSelector,
	GridToolbarExportContainer,
	GridViewColumnIcon,
	Toolbar,
	ToolbarButton,
	useGridApiContext,
	useGridSelector,
} from "@mui/x-data-grid-premium";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface ExportToolbarProps {
	handleExport?: (fileType: string, exportMode: string) => Promise<void> | void;
	allDataLoading?: boolean;
	type?: string;
	onCleanup?: () => void;
	selectionCount?: number;
	wizardEnabled?: boolean;
	onOpenWizard?: () => void;
}

export default function ExportToolbar({
	handleExport,
	allDataLoading,
	type,
	onCleanup,
	selectionCount = 0,
	wizardEnabled,
	onOpenWizard,
}: ExportToolbarProps) {
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const open = Boolean(anchorEl);
	const { t } = useTranslation();
	const apiRef = useGridApiContext();
	const filterModel = useGridSelector(apiRef, gridFilterModelSelector);
	const filterTooltipText = generateFilterDescription(filterModel);

	const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		setAnchorEl(event.currentTarget);
	};
	const handleMenuClose = () => setAnchorEl(null);

	// Every server grid exports TSV in three scopes: current (on-screen page),
	// filtered (all rows matching the applied filters), and all (the whole
	// dataset within the grid's base query).
	const onExportClick = (fileType: string, exportMode: string) => {
		if (handleExport) {
			handleExport(fileType, exportMode);
		}
	};

	const handleCleanupClick = () => {
		onCleanup?.();
		handleMenuClose();
	};

	return (
		<Toolbar>
			<Tooltip title={t("ui.data_grid.find_column")}>
				<ColumnsPanelTrigger render={<ToolbarButton />}>
					<GridViewColumnIcon fontSize="small" />
				</ColumnsPanelTrigger>
			</Tooltip>
			<Tooltip title={filterTooltipText}>
				<FilterPanelTrigger
					render={(props, state) => (
						<ToolbarButton {...props} color="default">
							<Badge badgeContent={state.filterCount} color="primary">
								<GridFilterListIcon fontSize="small" />
							</Badge>
						</ToolbarButton>
					)}
				/>
			</Tooltip>
			{handleExport ? (
				<GridToolbarExportContainer>
					<MenuItem
						onClick={() => onExportClick("tsv", "current")}
						disabled={allDataLoading}
					>
						<ListItemIcon>
							<FileDownloadOutlined />
						</ListItemIcon>
						<ListItemText>{t("ui.data_grid.export.current")}</ListItemText>
					</MenuItem>
					<MenuItem
						onClick={() => onExportClick("tsv", "filtered")}
						disabled={allDataLoading}
					>
						<ListItemIcon>
							<FileDownloadOutlined />
						</ListItemIcon>
						<ListItemText>{t("ui.data_grid.export.filtered")}</ListItemText>
					</MenuItem>
					<MenuItem
						onClick={() => onExportClick("tsv", "all")}
						disabled={allDataLoading}
					>
						<ListItemIcon>
							{allDataLoading ? (
								<CircularProgress size={20} />
							) : (
								<FileDownloadOutlined />
							)}
						</ListItemIcon>
						<ListItemText>{t("ui.data_grid.export.all")}</ListItemText>
					</MenuItem>
					{wizardEnabled ? <Divider /> : null}
					{wizardEnabled ? (
						<MenuItem onClick={onOpenWizard}>
							<ListItemIcon>
								<TuneRounded />
							</ListItemIcon>
							<ListItemText>{t("ui.data_grid.export.wizard")}</ListItemText>
						</MenuItem>
					) : null}
					<Divider />
					<MenuItem
						onClick={() => onExportClick("tsv", "print")}
						disabled={allDataLoading}
					>
						<ListItemIcon>
							<PrintOutlined />
						</ListItemIcon>
						<ListItemText>{t("ui.data_grid.print_current_page")}</ListItemText>
					</MenuItem>
				</GridToolbarExportContainer>
			) : null}
			{type == "patronRequests" && (
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
		</Toolbar>
	);
}
