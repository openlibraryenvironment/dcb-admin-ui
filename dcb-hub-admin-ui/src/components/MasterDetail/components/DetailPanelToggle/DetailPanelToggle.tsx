import { IconButton, Tooltip } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
	GridRenderCellParams,
	useGridApiContext,
	useGridSelector,
	gridDetailPanelExpandedRowsContentCacheSelector,
	gridDetailPanelExpandedRowIdsSelector,
	GridApiPro,
} from "@mui/x-data-grid-premium";
import { isValidElement, MutableRefObject } from "react";
import { useTranslation } from "next-i18next";

export function DetailPanelToggle(
	props: Pick<GridRenderCellParams, "id" | "value">,
) {
	// 1. ALL HOOKS AT THE TOP
	const { t } = useTranslation(); //
	const { id } = props;
	const apiRef = useGridApiContext() as MutableRefObject<GridApiPro>; //

	const expandedRowIds = useGridSelector(
		apiRef,
		gridDetailPanelExpandedRowIdsSelector,
	);

	const contentCache = useGridSelector(
		apiRef,
		gridDetailPanelExpandedRowsContentCacheSelector,
	); //

	// 2. NOW we can do our conditional return safely
	const rowNode = apiRef.current.getRowNode(id);
	if (rowNode?.type === "group") {
		return null;
	}

	// 3. Calculate derived state
	const isExpanded = expandedRowIds.includes(id);
	const hasDetail = isValidElement(contentCache[id]); //

	return (
		<Tooltip
			title={isExpanded ? t("ui.data_grid.collapse") : t("ui.data_grid.expand")} //
		>
			<IconButton
				size="small"
				tabIndex={-1}
				disabled={!hasDetail} //
				aria-label={isExpanded ? "Close" : "Open"} //
				onClick={(event) => {
					event.stopPropagation();
					apiRef.current.toggleDetailPanel(id);
				}}
			>
				<ExpandMoreIcon
					sx={{
						transform: `rotateZ(${isExpanded ? 180 : 0}deg)`, //
						transition: (theme: any) =>
							theme.transitions.create("transform", {
								duration: theme.transitions.duration.shortest,
							}), //
					}}
					fontSize="inherit" //
				/>
			</IconButton>
		</Tooltip>
	);
}
