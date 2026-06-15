import { MutableRefObject } from "react";
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
	GridApiPremium,
} from "@mui/x-data-grid-premium";

export default function DetailPanelHeader() {
	// UPGRADE: Cast context directly to the high-performance dynamic GridApiPremium instance
	const apiRef = useGridApiContext() as MutableRefObject<GridApiPremium>;
	const { t } = useTranslation();

	// UPGRADE: MUI X V8 returns expandedRowIds natively as an optimized Set<GridRowId> collection
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

			// Populate high-performance unique key collection
			for (const key in rowsWithDetailPanels) {
				if (Object.prototype.hasOwnProperty.call(rowsWithDetailPanels, key)) {
					const rowData = dataRowIdToModelLookup[key];
					if (rowData) {
						allRowIdsWithDetailPanels.add(apiRef.current.getRowId(rowData));
					}
				}
			}
			// UPGRADE: Set values cleanly as a Set per the restored V8 specification standards
			apiRef.current.setExpandedDetailPanels(allRowIdsWithDetailPanels);
		} else {
			apiRef.current.setExpandedDetailPanels(new Set());
		}
	};

	const Icon = noDetailPanelsOpen ? UnfoldMore : UnfoldLess;

	return (
		<Tooltip
			title={noDetailPanelsOpen ? t("details.expand") : t("details.collapse")}
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
