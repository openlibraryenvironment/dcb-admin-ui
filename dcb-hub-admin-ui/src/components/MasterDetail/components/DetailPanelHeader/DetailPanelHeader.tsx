import { IconButton, Tooltip } from "@mui/material";
import {
	useGridSelector,
	gridDetailPanelExpandedRowIdsSelector,
	gridDetailPanelExpandedRowsContentCacheSelector,
	gridRowsLookupSelector,
	GridRowId,
	useGridApiContext,
	GridApiPro,
} from "@mui/x-data-grid-premium";
import { useTranslation } from "next-i18next";
import { MutableRefObject } from "react";
import { UnfoldLess, UnfoldMore } from "@mui/icons-material";

export default function DetailPanelHeader() {
	const apiRef = useGridApiContext() as MutableRefObject<GridApiPro>;
	const { t } = useTranslation();

	const expandedRowIds = useGridSelector(
		apiRef,
		gridDetailPanelExpandedRowIdsSelector,
	);
	const rowsWithDetailPanels = useGridSelector(
		apiRef,
		gridDetailPanelExpandedRowsContentCacheSelector,
	);

	// const noDetailPanelsOpen = expandedRowIds.size === 0; // to be restored when we upgrade to v8
	const noDetailPanelsOpen = expandedRowIds.length === 0;
	// RESTORE WHEN WE UPGRADE TO V8 - CURRENTLY UNABLE TO BECAUSE OF NEXT.JS
	// const expandOrCollapseAll = () => {
	// 	if (noDetailPanelsOpen) {
	// 		const dataRowIdToModelLookup = gridRowsLookupSelector(apiRef);
	// 		const allRowIdsWithDetailPanels = new Set<GridRowId>();
	// 		for (const key in rowsWithDetailPanels) {
	// 			if (Object.prototype.hasOwnProperty.call(rowsWithDetailPanels, key)) {
	// 				const rowData = dataRowIdToModelLookup[key];
	// 				const givenRow = gridRowIdSelector(apiRef, rowData);
	// 				allRowIdsWithDetailPanels.add(givenRow);
	// 			}
	// 		}
	// 		apiRef.current.setExpandedDetailPanels(allRowIdsWithDetailPanels);
	// 	} else {
	// 		apiRef.current.setExpandedDetailPanels(new Set());
	// 	}
	// };

	const expandOrCollapseAll = () => {
		const dataRowIdToModelLookup = gridRowsLookupSelector(apiRef);
		const allRowIdsWithDetailPanels: GridRowId[] = Object.keys(
			rowsWithDetailPanels,
		).map((key) => apiRef.current.getRowId(dataRowIdToModelLookup[key]));

		apiRef.current.setExpandedDetailPanels(
			noDetailPanelsOpen ? allRowIdsWithDetailPanels : [],
		);
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
