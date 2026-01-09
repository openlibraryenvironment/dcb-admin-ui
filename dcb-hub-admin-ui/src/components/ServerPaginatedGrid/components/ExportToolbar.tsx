import {
	ChecklistRounded,
	CleaningServicesRounded,
	FileDownloadOutlined,
	PrintOutlined,
} from "@mui/icons-material";
import {
	Box,
	Button,
	CircularProgress,
	ListItemIcon,
	ListItemText,
	Menu,
	MenuItem,
} from "@mui/material";
import {
	GridToolbarColumnsButton,
	GridToolbarContainer,
	GridToolbarDensitySelector,
	GridToolbarExportContainer,
	GridToolbarFilterButton,
	GridToolbarQuickFilter,
} from "@mui/x-data-grid-premium";
import { useTranslation } from "next-i18next";
import { useState } from "react";

interface ExportToolbarProps {
	handleExport: (fileType: string, exportMode: string) => Promise<void>;
	allDataLoading: boolean;
	type: string;
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
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const open = Boolean(anchorEl);

	const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		setAnchorEl(event.currentTarget);
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
					{type != "patronRequests" ? (
						<MenuItem
							onClick={() => handleExport("csv", "default")}
							disabled={allDataLoading}
						>
							<ListItemIcon>
								{allDataLoading ? (
									<CircularProgress />
								) : (
									<FileDownloadOutlined />
								)}
							</ListItemIcon>
							<ListItemText>{t("ui.data_grid.export_all_csv")}</ListItemText>
						</MenuItem>
					) : null}
					{type != "patronRequests" ? (
						<MenuItem
							onClick={() => handleExport("tsv", "default")}
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
							onClick={() => handleExport("csv", "all")}
							disabled={allDataLoading}
						>
							<ListItemIcon>
								<FileDownloadOutlined />
							</ListItemIcon>
							<ListItemText>{t("ui.data_grid.export_all")}</ListItemText>
						</MenuItem>
					) : null}
					{type == "patronRequests" ? (
						<MenuItem
							onClick={() => handleExport("csv", "filtered")}
							disabled={allDataLoading}
						>
							<ListItemIcon>
								<FileDownloadOutlined />
							</ListItemIcon>
							<ListItemText>{t("ui.data_grid.export_filtered")}</ListItemText>
						</MenuItem>
					) : null}
					{type == "patronRequests" ? (
						<MenuItem
							onClick={() => handleExport("csv", "current")}
							disabled={allDataLoading}
						>
							<ListItemIcon>
								<FileDownloadOutlined />
							</ListItemIcon>
							<ListItemText>{t("ui.data_grid.export_current")}</ListItemText>
						</MenuItem>
					) : null}
					<MenuItem
						onClick={() => handleExport("csv", "print")}
						disabled={allDataLoading}
					>
						<ListItemIcon>
							<PrintOutlined />
						</ListItemIcon>
						<ListItemText>{t("ui.data_grid.print_current_page")}</ListItemText>
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
							MenuListProps={{
								"aria-labelledby": "actions-button",
							}}
						>
							<MenuItem onClick={handleCleanupClick}>
								<ListItemIcon>
									<CleaningServicesRounded fontSize="small" />
								</ListItemIcon>
								<ListItemText>
									{t("ui.data_grid.cleanup_selected", {
										count: selectionCount,
										defaultValue: "Cleanup Selected",
									})}
								</ListItemText>
							</MenuItem>

							{/* You can add more MenuItems here in the future */}
						</Menu>
					</>
				)}
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

// v8 implementation below
// import { FileDownloadOutlined, PrintOutlined } from "@mui/icons-material";
// import {
// 	Box,
// 	CircularProgress,
// 	ListItemIcon,
// 	ListItemText,
// 	MenuItem,
// 	Toolbar,
// } from "@mui/material";
// import {
// 	ColumnsPanelTrigger,
// 	FilterPanelTrigger,
// 	GridToolbarDensitySelector, // We may have to implement our own density selector in future.
// 	GridToolbarExportContainer,
// 	QuickFilter,
// 	QuickFilterClear,
// 	QuickFilterControl,
// 	QuickFilterTrigger,
// } from "@mui/x-data-grid-premium";
// import { useTranslation } from "next-i18next";

// interface ExportToolbarProps {
// 	handleExport: (fileType: string, exportMode: string) => Promise<void>;
// 	allDataLoading: boolean;
// 	type: string;
// }
// export default function ExportToolbar({
// 	handleExport,
// 	allDataLoading,
// 	type,
// }: ExportToolbarProps) {
// 	const { t } = useTranslation();
// 	return (
// 		<Box
// 			sx={{
// 				p: 0.5,
// 				pb: 0,
// 			}}
// 		>
// 			<Toolbar>
// 				<ColumnsPanelTrigger />
// 				<FilterPanelTrigger />
// 				<GridToolbarDensitySelector />
// 				<GridToolbarExportContainer>
// 					{type != "patronRequests" ? (
// 						<MenuItem
// 							onClick={() => handleExport("csv", "default")}
// 							disabled={allDataLoading}
// 						>
// 							<ListItemIcon>
// 								{allDataLoading ? (
// 									<CircularProgress />
// 								) : (
// 									<FileDownloadOutlined />
// 								)}
// 							</ListItemIcon>
// 							<ListItemText>{t("ui.data_grid.export_all_csv")}</ListItemText>
// 						</MenuItem>
// 					) : null}
// 					{type != "patronRequests" ? (
// 						<MenuItem
// 							onClick={() => handleExport("tsv", "default")}
// 							disabled={allDataLoading}
// 						>
// 							<ListItemIcon>
// 								<FileDownloadOutlined />
// 							</ListItemIcon>
// 							<ListItemText>{t("ui.data_grid.export_all_tsv")}</ListItemText>
// 						</MenuItem>
// 					) : null}
// 					{type == "patronRequests" ? (
// 						<MenuItem
// 							onClick={() => handleExport("csv", "all")}
// 							disabled={allDataLoading}
// 						>
// 							<ListItemIcon>
// 								<FileDownloadOutlined />
// 							</ListItemIcon>
// 							<ListItemText>{t("ui.data_grid.export_all")}</ListItemText>
// 						</MenuItem>
// 					) : null}
// 					{type == "patronRequests" ? (
// 						<MenuItem
// 							onClick={() => handleExport("csv", "filtered")}
// 							disabled={allDataLoading}
// 						>
// 							<ListItemIcon>
// 								<FileDownloadOutlined />
// 							</ListItemIcon>
// 							<ListItemText>{t("ui.data_grid.export_filtered")}</ListItemText>
// 						</MenuItem>
// 					) : null}
// 					{type == "patronRequests" ? (
// 						<MenuItem
// 							onClick={() => handleExport("csv", "current")}
// 							disabled={allDataLoading}
// 						>
// 							<ListItemIcon>
// 								<FileDownloadOutlined />
// 							</ListItemIcon>
// 							<ListItemText>{t("ui.data_grid.export_current")}</ListItemText>
// 						</MenuItem>
// 					) : null}
// 					<MenuItem
// 						onClick={() => handleExport("csv", "print")}
// 						disabled={allDataLoading}
// 					>
// 						<ListItemIcon>
// 							<PrintOutlined />
// 						</ListItemIcon>
// 						<ListItemText>{t("ui.data_grid.print_current_page")}</ListItemText>
// 					</MenuItem>
// 				</GridToolbarExportContainer>
// 			</Toolbar>
// 			<QuickFilter
// 				debounceMs={100}
// 				quickFilterParser={(searchInput: string) =>
// 					searchInput
// 						.split(",")
// 						.map((value) => value.trim())
// 						.filter((value) => value !== "")
// 				}
// 			>
// 				<QuickFilterTrigger />
// 				<QuickFilterControl />
// 				<QuickFilterClear />
// 			</QuickFilter>
// 		</Box>
// 	);
// }
