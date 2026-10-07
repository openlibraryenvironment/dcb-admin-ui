import { generateFilterDescription } from "@helpers/dataGrid/utilities";
import {
	Check,
	ChecklistRounded,
	CleaningServicesRounded,
	FileDownloadOutlined,
	PrintOutlined,
	SettingsBackupRestoreRounded,
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
	ListSubheader,
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
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface ExportToolbarProps {
	handleExport?: (fileType: string, exportMode: string) => Promise<void> | void;
	allDataLoading?: boolean;
	type?: string;
	onCleanup?: () => void;
	onRollback?: () => void;
	selectionCount?: number;
	wizardEnabled?: boolean;
	onOpenWizard?: () => void;
	disableToolbarFilter?: boolean;
}

/**
 * GridToolbarExportContainer clones every direct child with a `hideMenu` callback
 * and does NOT wrap its onClick, so an item that does not call it leaves the menu
 * open after downloading. These two types exist to make that decision explicit:
 * choosing a format keeps the menu open, choosing a scope closes it.
 */
interface ExportMenuItemProps {
	hideMenu?: () => void;
}

// Takes no `hideMenu` ON PURPOSE: choosing a format must leave the menu open so a
// scope can follow in the same opening. Not destructuring it is what enforces that -
// a test asserting it was not called could never fail.
export function FormatMenuItem({
	label,
	selected,
	selectedLabel,
	onSelect,
}: ExportMenuItemProps & {
	label: string;
	selected: boolean;
	selectedLabel: string;
	onSelect: () => void;
}) {
	return (
		<MenuItem
			onClick={onSelect}
			selected={selected}
			// The tick is painted, so it has to be in the accessible name too: a
			// reader who cannot see it was told "CSV" either way. WCAG 1.3.1.
			aria-label={selected ? selectedLabel : label}
		>
			<ListItemIcon>
				{selected ? <Check fontSize="small" /> : null}
			</ListItemIcon>
			<ListItemText>{label}</ListItemText>
		</MenuItem>
	);
}

export function ScopeMenuItem({
	hideMenu,
	label,
	icon,
	disabled,
	onRun,
}: ExportMenuItemProps & {
	label: string;
	icon: ReactNode;
	disabled?: boolean;
	onRun: () => void;
}) {
	return (
		<MenuItem
			disabled={disabled}
			onClick={() => {
				onRun();
				hideMenu?.();
			}}
		>
			<ListItemIcon>{icon}</ListItemIcon>
			<ListItemText>{label}</ListItemText>
		</MenuItem>
	);
}

export default function ExportToolbar({
	handleExport,
	allDataLoading,
	type,
	onCleanup,
	onRollback,
	selectionCount = 0,
	wizardEnabled,
	onOpenWizard,
	disableToolbarFilter,
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

	/**
	 * The format the three scope exports below use.
	 *
	 * It is STATE and it is shown, because the menu previously hardcoded "tsv" at
	 * every call site: CSV survived only inside the export wizard, which defaults to
	 * TSV as well, so a reader who wanted a CSV had no way to see that one existed.
	 * Libraries reported exports "coming out as TSV" and could not say why.
	 *
	 * TSV stays the default, so nobody's saved workflow changes; what changes is that
	 * the choice is visible and reachable in one click.
	 */
	const [format, setFormat] = useState<"csv" | "tsv">("tsv");

	const onExportClick = (fileType: string, exportMode: string) => {
		if (handleExport) {
			handleExport(fileType, exportMode);
		}
	};

	const handleCleanupClick = () => {
		onCleanup?.();
		handleMenuClose();
	};

	const handleRollbackClick = () => {
		onRollback?.();
		handleMenuClose();
	};

	return (
		<Toolbar>
			<Tooltip title={t("ui.data_grid.find_column")}>
				<ColumnsPanelTrigger render={<ToolbarButton />}>
					<GridViewColumnIcon fontSize="small" />
				</ColumnsPanelTrigger>
			</Tooltip>
			{!disableToolbarFilter ? (
				<Tooltip title={filterTooltipText}>
					<FilterPanelTrigger
						render={(props, state) => (
							<ToolbarButton
								{...props}
								color="default"
								// The count is PAINTED on this button, so it has to be in the
								// button's name: a reader who cannot see the badge was told
								// "Show filters" whether two filters were applied or none.
								// WCAG 2.5.3 Label in Name.
								aria-label={
									state.filterCount
										? t("ui.data_grid.filters.trigger_applied", {
												count: state.filterCount,
											})
										: t("ui.data_grid.filters.trigger")
								}
							>
								{/* null rather than 0, so an unfiltered grid paints no digit
								    at all and there is no visible text to match. */}
								<Badge badgeContent={state.filterCount || null} color="primary">
									<GridFilterListIcon fontSize="small" />
								</Badge>
							</ToolbarButton>
						)}
					/>
				</Tooltip>
			) : null}
			{handleExport ? (
				<GridToolbarExportContainer>
					<ListSubheader>{t("ui.data_grid.export.format_group")}</ListSubheader>
					<FormatMenuItem
						label={t("ui.data_grid.export.format_csv")}
						selected={format === "csv"}
						selectedLabel={t("ui.data_grid.export.format_selected", {
							format: t("ui.data_grid.export.format_csv"),
						})}
						onSelect={() => setFormat("csv")}
					/>
					<FormatMenuItem
						label={t("ui.data_grid.export.format_tsv")}
						selected={format === "tsv"}
						selectedLabel={t("ui.data_grid.export.format_selected", {
							format: t("ui.data_grid.export.format_tsv"),
						})}
						onSelect={() => setFormat("tsv")}
					/>
					<Divider />
					<ListSubheader>{t("ui.data_grid.export.rows_group")}</ListSubheader>
					<ScopeMenuItem
						label={t("ui.data_grid.export.current")}
						icon={<FileDownloadOutlined />}
						disabled={allDataLoading}
						onRun={() => onExportClick(format, "current")}
					/>
					<ScopeMenuItem
						label={t("ui.data_grid.export.filtered")}
						icon={<FileDownloadOutlined />}
						disabled={allDataLoading}
						onRun={() => onExportClick(format, "filtered")}
					/>
					<ScopeMenuItem
						label={t("ui.data_grid.export.all")}
						icon={
							allDataLoading ? (
								<CircularProgress size={20} />
							) : (
								<FileDownloadOutlined />
							)
						}
						disabled={allDataLoading}
						onRun={() => onExportClick(format, "all")}
					/>
					<Divider />
					{/* MUI X Premium's own workbook, and its exporter only sees the rows the
					    grid holds - so the label says so rather than silently exporting one
					    page of a dataset the reader asked for all of. docs/mappings-export.md */}
					<ScopeMenuItem
						label={t("ui.data_grid.export.excel")}
						icon={<FileDownloadOutlined />}
						onRun={() => onExportClick("excel", "current")}
					/>
					{wizardEnabled ? <Divider /> : null}
					{wizardEnabled ? (
						<ScopeMenuItem
							label={t("ui.data_grid.export.wizard")}
							icon={<TuneRounded />}
							onRun={() => onOpenWizard?.()}
						/>
					) : null}
					<Divider />
					<ScopeMenuItem
						label={t("ui.data_grid.print_current_page")}
						icon={<PrintOutlined />}
						disabled={allDataLoading}
						onRun={() => onExportClick(format, "print")}
					/>
				</GridToolbarExportContainer>
			) : null}
			{/* The Actions button appears only when the user actually has an action
			    to take (each handler is passed by DataGrid only when the role allows
			    it) - so a user with no permitted actions never sees an empty menu,
			    and no menu item is a no-op the way the ungated cleanup item was. */}
			{type == "patronRequests" && (onCleanup || onRollback) && (
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
						{onCleanup ? (
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
						) : null}
						{onRollback ? (
							<MenuItem onClick={handleRollbackClick}>
								<ListItemIcon>
									<SettingsBackupRestoreRounded fontSize="small" />
								</ListItemIcon>
								<ListItemText>
									{t("ui.data_grid.rollback.selected", {
										count: selectionCount,
									})}
								</ListItemText>
							</MenuItem>
						) : null}
					</Menu>
				</>
			)}
		</Toolbar>
	);
}
