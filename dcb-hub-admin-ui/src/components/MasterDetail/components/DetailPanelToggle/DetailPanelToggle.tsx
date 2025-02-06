import { IconButton, Tooltip } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
	GridRenderCellParams,
	useGridApiContext,
	useGridSelector,
	gridDetailPanelExpandedRowsContentCacheSelector,
	GridApiPro,
} from "@mui/x-data-grid-pro";
import { isValidElement, MutableRefObject } from "react";
import { useTranslation } from "next-i18next";

export function DetailPanelToggle(
	props: Pick<GridRenderCellParams, "id" | "value">,
) {
	const { t } = useTranslation();

	const { id, value: isExpanded } = props;
	const apiRef = useGridApiContext() as MutableRefObject<GridApiPro>;

	// To avoid calling ´getDetailPanelContent` all the time, the following selector
	// gives an object with the detail panel content for each row id.
	const contentCache = useGridSelector(
		apiRef,
		gridDetailPanelExpandedRowsContentCacheSelector,
	);

	// If the value is not a valid React element, it means that the row has no detail panel.
	const hasDetail = isValidElement(contentCache[id]);

	return (
		<Tooltip
			title={isExpanded ? t("ui.data_grid.collapse") : t("ui.data_grid.expand")}
		>
			<IconButton
				size="small"
				tabIndex={-1}
				disabled={!hasDetail}
				aria-label={isExpanded ? "Close" : "Open"}
			>
				<ExpandMoreIcon
					sx={{
						transform: `rotateZ(${isExpanded ? 180 : 0}deg)`,
						transition: (theme: any) =>
							theme.transitions.create("transform", {
								duration: theme.transitions.duration.shortest,
							}),
					}}
					fontSize="inherit"
				/>
			</IconButton>
		</Tooltip>
	);
}
