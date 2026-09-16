import { useTranslation } from "react-i18next";
import { IconButton, Tooltip } from "@mui/material";
import { UnfoldLess, UnfoldMore } from "@mui/icons-material";
import {
	GRID_DETAIL_PANEL_TOGGLE_FIELD,
	useGridEvent,
	useGridSelector,
	gridDetailPanelExpandedRowIdsSelector,
	gridDetailPanelExpandedRowsContentCacheSelector,
	gridRowsLookupSelector,
	GridRowId,
	useGridApiContext,
} from "@mui/x-data-grid-premium";

export default function DetailPanelHeader() {
	const apiRef = useGridApiContext();
	const { t } = useTranslation();

	const expandedRowIds = useGridSelector(
		apiRef,
		gridDetailPanelExpandedRowIdsSelector,
	) as Set<GridRowId>;
	const rowsWithDetailPanels = useGridSelector(
		apiRef,
		gridDetailPanelExpandedRowsContentCacheSelector,
	);

	const noDetailPanelsOpen = expandedRowIds.size === 0;

	const expandOrCollapseAll = () => {
		if (noDetailPanelsOpen) {
			const dataRowIdToModelLookup = gridRowsLookupSelector(apiRef);
			const allRowIdsWithDetailPanels = new Set<GridRowId>();

			for (const key in rowsWithDetailPanels) {
				if (Object.prototype.hasOwnProperty.call(rowsWithDetailPanels, key)) {
					const rowData = dataRowIdToModelLookup[key];
					if (rowData) {
						allRowIdsWithDetailPanels.add(apiRef.current.getRowId(rowData));
					}
				}
			}
			apiRef.current.setExpandedDetailPanels(allRowIdsWithDetailPanels);
		} else {
			apiRef.current.setExpandedDetailPanels(new Set());
		}
	};

	// The grid focuses the column header itself and ignores keys from focusable header
	// content, so a tabbable button here would strand arrow-key navigation. The header's
	// keys are handled at the grid instead.
	useGridEvent(apiRef, "columnHeaderKeyDown", (params, event) => {
		if (
			params.field === GRID_DETAIL_PANEL_TOGGLE_FIELD &&
			(event.key === "Enter" || event.key === " ")
		) {
			event.preventDefault();
			expandOrCollapseAll();
		}
	});

	const Icon = noDetailPanelsOpen ? UnfoldMore : UnfoldLess;
	const label = noDetailPanelsOpen
		? t("ui.data_grid.expand_all_details")
		: t("ui.data_grid.collapse_all_details");

	return (
		<Tooltip title={label}>
			<span>
				<IconButton
					size="small"
					tabIndex={-1}
					onClick={expandOrCollapseAll}
					aria-label={label}
				>
					<Icon fontSize="inherit" />
				</IconButton>
			</span>
		</Tooltip>
	);
}
