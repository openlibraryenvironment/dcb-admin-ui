import { generateFilterDescription } from "@helpers/dataGrid/utilities";
import {
	ChecklistRounded,
	CleaningServicesRounded,
	FileDownloadOutlined,
	PrintOutlined,
} from "@mui/icons-material";
import {
	Badge,
	Button,
	CircularProgress,
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
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const open = Boolean(anchorEl);

	const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		setAnchorEl(event.currentTarget);
	};
	const onExportClick = (fileType: string, exportMode: string) => {
		if (handleExport) {
			handleExport(fileType, exportMode);
		} else {
			console.warn("Export function is not available for this grid.");
		}
	};

	const handleMenuClose = () => {
		setAnchorEl(null);
	};

	const handleCleanupClick = () => {
		if (onCleanup) {
			console.log("Cleaning ");
			onCleanup();
		}
		handleMenuClose();
	};
	const { t } = useTranslation();
	const apiRef = useGridApiContext();
	const filterModel = useGridSelector(apiRef, gridFilterModelSelector);
	const filterTooltipText = generateFilterDescription(filterModel);
	// Further customisation needed - ideally it would be "filters" text on the button but in the old style
	return (
		<Toolbar>
			<Tooltip title="Columns">
				<ColumnsPanelTrigger render={<ToolbarButton />}>
					<GridViewColumnIcon fontSize="small" />
				</ColumnsPanelTrigger>
			</Tooltip>
			<Tooltip title={filterTooltipText}>
				<FilterPanelTrigger
					render={(props, state) => (
						<ToolbarButton {...props} color="default">
							<Badge badgeContent={state.filterCount} color="primary">
								{/* // variant="dot"> */}
								<GridFilterListIcon fontSize="small" />
							</Badge>
						</ToolbarButton>
					)}
				/>
			</Tooltip>
			{/* <GridToolbarDensitySelector /> */}
			<GridToolbarExportContainer>
				{type != "patronRequests" ? (
					<MenuItem
						onClick={() => onExportClick("csv", "default")}
						disabled={allDataLoading}
					>
						<ListItemIcon>
							{allDataLoading ? <CircularProgress /> : <FileDownloadOutlined />}
						</ListItemIcon>
						<ListItemText>{t("ui.data_grid.export_all_csv")}</ListItemText>
					</MenuItem>
				) : null}
				{type != "patronRequests" ? (
					<MenuItem
						onClick={() => onExportClick("tsv", "default")}
						disabled={allDataLoading}
					>
						<ListItemIcon>
							<FileDownloadOutlined />
						</ListItemIcon>
						<ListItemText>{t("ui.data_grid.export_all_tsv")}</ListItemText>
					</MenuItem>
				) : null}
				{type == "patronRequests" ? (
					<MenuItem
						onClick={() => onExportClick("csv", "all")}
						disabled={allDataLoading}
					>
						<ListItemIcon>
							<FileDownloadOutlined />
						</ListItemIcon>
						<ListItemText>{t("ui.data_grid.export.all")}</ListItemText>
					</MenuItem>
				) : null}
				{type == "patronRequests" ? (
					<MenuItem
						onClick={() => onExportClick("csv", "filtered")}
						disabled={allDataLoading}
					>
						<ListItemIcon>
							<FileDownloadOutlined />
						</ListItemIcon>
						<ListItemText>{t("ui.data_grid.export.filtered")}</ListItemText>
					</MenuItem>
				) : null}
				{type == "patronRequests" ? (
					<MenuItem
						onClick={() => onExportClick("csv", "current")}
						disabled={allDataLoading}
					>
						<ListItemIcon>
							<FileDownloadOutlined />
						</ListItemIcon>
						<ListItemText>{t("ui.data_grid.export.current")}</ListItemText>
					</MenuItem>
				) : null}
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
			{type == "patronRequests" && (
				<>
					{/* <Divider orientation="vertical" flexItem sx={{ mx: 1 }} /> */}
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
