import { MutableRefObject, isValidElement } from "react";
import { useTranslation } from "react-i18next";
import { IconButton, Tooltip } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
	GridRenderCellParams,
	useGridApiContext,
	useGridSelector,
	gridDetailPanelExpandedRowsContentCacheSelector,
	gridDetailPanelExpandedRowIdsSelector,
	GridApiPremium,
	GridRowId,
} from "@mui/x-data-grid-premium";

export function DetailPanelToggle(
	props: Pick<GridRenderCellParams, "id" | "value">,
) {
	const { t } = useTranslation();
	const { id } = props;
	const apiRef = useGridApiContext() as MutableRefObject<GridApiPremium>;

	// UPGRADE: Read collection natively as an optimized lookahead Set
	const expandedRowIds = useGridSelector(
		apiRef,
		gridDetailPanelExpandedRowIdsSelector,
	) as Set<GridRowId>;
	const contentCache = useGridSelector(
		apiRef,
		gridDetailPanelExpandedRowsContentCacheSelector,
	);

	// eslint-disable-next-line react-hooks/refs -- MUI DataGrid apiRef is populated and safe to read during render
	const rowNode = apiRef.current.getRowNode(id);
	if (rowNode?.type === "group") {
		return null;
	}

	const isExpanded = expandedRowIds.has(id);
	const hasDetail = isValidElement(contentCache[id]);

	return (
		<Tooltip
			title={isExpanded ? t("ui.data_grid.collapse") : t("ui.data_grid.expand")}
		>
			<span>
				<IconButton
					size="small"
					tabIndex={-1}
					disabled={!hasDetail}
					aria-label={isExpanded ? "Close" : "Open"}
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
