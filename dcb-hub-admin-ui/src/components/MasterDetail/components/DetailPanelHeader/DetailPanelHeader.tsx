import { useTranslation } from "react-i18next";
import { IconButton, Tooltip } from "@mui/material";
import { UnfoldLess, UnfoldMore } from "@mui/icons-material";
import {
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

	const Icon = noDetailPanelsOpen ? UnfoldMore : UnfoldLess;

	return (
		<Tooltip
			title={
				noDetailPanelsOpen
					? t("ui.data_grid.expand")
					: t("ui.data_grid.collapse")
			}
		>
			<span>
				<IconButton
					size="small"
					tabIndex={-1}
					onClick={expandOrCollapseAll}
					aria-label={noDetailPanelsOpen ? "Expand All" : "Collapse All"}
				>
					<Icon fontSize="inherit" />
				</IconButton>
			</span>
		</Tooltip>
	);
}
