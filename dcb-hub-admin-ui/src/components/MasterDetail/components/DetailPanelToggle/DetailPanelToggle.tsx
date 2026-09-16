import { isValidElement } from "react";
import { useTranslation } from "react-i18next";
import { IconButton, Tooltip } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
	GRID_DETAIL_PANEL_TOGGLE_FIELD,
	GridRenderCellParams,
	useGridApiContext,
	useGridEvent,
	useGridSelector,
	gridDetailPanelExpandedRowsContentCacheSelector,
	gridDetailPanelExpandedRowIdsSelector,
	GridRowId,
} from "@mui/x-data-grid-premium";

export function DetailPanelToggle({ id }: Pick<GridRenderCellParams, "id">) {
	const { t } = useTranslation();
	const apiRef = useGridApiContext();

	const expandedRowIds = useGridSelector(
		apiRef,
		gridDetailPanelExpandedRowIdsSelector,
	) as Set<GridRowId>;
	const contentCache = useGridSelector(
		apiRef,
		gridDetailPanelExpandedRowsContentCacheSelector,
	);

	// Space on the focused cell is useGridDetailPanel's; the grid does nothing on Enter.
	useGridEvent(apiRef, "cellKeyDown", (params, event) => {
		if (
			params.id === id &&
			params.field === GRID_DETAIL_PANEL_TOGGLE_FIELD &&
			event.key === "Enter" &&
			isValidElement(contentCache[id])
		) {
			event.preventDefault();
			apiRef.current.toggleDetailPanel(id);
		}
	});

	// eslint-disable-next-line react-hooks/refs -- MUI DataGrid apiRef is populated and safe to read during render
	const rowNode = apiRef.current.getRowNode(id);
	if (rowNode?.type === "group") {
		return null;
	}

	const isExpanded = expandedRowIds.has(id);
	const hasDetail = isValidElement(contentCache[id]);
	const label = isExpanded
		? t("ui.data_grid.collapse_details")
		: t("ui.data_grid.expand_details");

	return (
		<Tooltip title={label}>
			<span>
				<IconButton
					size="small"
					// Focus rests on the cell, as in MUI's own toggle. A tabbable button inside the
					// roving-tabindex cell is a second, nested target: axe target-size failed the
					// cell at 50x13px of its 50x52px.
					tabIndex={-1}
					disabled={!hasDetail}
					aria-label={label}
					aria-expanded={isExpanded}
					onClick={(event) => {
						event.stopPropagation();
						apiRef.current.toggleDetailPanel(id);
					}}
				>
					<ExpandMoreIcon
						sx={{
							transform: `rotateZ(${isExpanded ? 180 : 0}deg)`,
							transition: (theme) =>
								theme.transitions.create("transform", {
									duration: theme.transitions.duration.shortest,
								}),
						}}
						fontSize="inherit"
					/>
				</IconButton>
			</span>
		</Tooltip>
	);
}
