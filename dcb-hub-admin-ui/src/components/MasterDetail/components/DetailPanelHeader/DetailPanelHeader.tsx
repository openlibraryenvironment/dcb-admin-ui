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
import { MdUnfoldLess, MdUnfoldMore } from "react-icons/md";

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

	const noDetailPanelsOpen = expandedRowIds.length === 0;

	const expandOrCollapseAll = () => {
		const dataRowIdToModelLookup = gridRowsLookupSelector(apiRef);
		const allRowIdsWithDetailPanels: GridRowId[] = Object.keys(
			rowsWithDetailPanels,
		).map((key) => apiRef.current.getRowId(dataRowIdToModelLookup[key]));

		apiRef.current.setExpandedDetailPanels(
			noDetailPanelsOpen ? allRowIdsWithDetailPanels : [],
		);
	};

	const Icon = noDetailPanelsOpen ? MdUnfoldMore : MdUnfoldLess;

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
