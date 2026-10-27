import type { MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { ArrowBack, ArrowForward } from "@mui/icons-material";
import {
	gridPinnedColumnsSelector,
	gridVisibleColumnFieldsSelector,
	useGridApiContext,
	useGridRootProps,
	useGridSelector,
	type GridColumnMenuItemProps,
} from "@mui/x-data-grid-premium";

import { isOwnColumn } from "../useColumnLayout";

/**
 * Move left and Move right in the column menu: column order without dragging (WCAG 2.2 SC
 * 2.5.7). Pinned columns sit in their own section and are not moved. docs/url-view-state.md.
 */
export function ColumnMenuMoveItem({
	colDef,
	onClick,
}: GridColumnMenuItemProps) {
	const { t } = useTranslation();
	const apiRef = useGridApiContext();
	const rootProps = useGridRootProps();
	const visible = useGridSelector(apiRef, gridVisibleColumnFieldsSelector);
	const { left = [], right = [] } = useGridSelector(
		apiRef,
		gridPinnedColumnsSelector,
	);
	const pinned = new Set([...left, ...right]);
	if (!colDef || pinned.has(colDef.field)) return null;

	const movable = visible.filter(
		(field) => !isOwnColumn(field) && !pinned.has(field),
	);
	const position = movable.indexOf(colDef.field);
	const move = (event: MouseEvent<HTMLElement>, offset: -1 | 1) => {
		const neighbour = movable[position + offset];
		if (neighbour) {
			apiRef.current.setColumnIndex(
				colDef.field,
				apiRef.current.getColumnIndex(neighbour, false),
			);
		}
		onClick(event);
	};

	return (
		<>
			<rootProps.slots.baseMenuItem
				onClick={(event) => move(event, -1)}
				disabled={position <= 0}
				iconStart={<ArrowBack fontSize="small" />}
			>
				{t("ui.data_grid.column_menu.move_left")}
			</rootProps.slots.baseMenuItem>
			<rootProps.slots.baseMenuItem
				onClick={(event) => move(event, 1)}
				disabled={position < 0 || position >= movable.length - 1}
				iconStart={<ArrowForward fontSize="small" />}
			>
				{t("ui.data_grid.column_menu.move_right")}
			</rootProps.slots.baseMenuItem>
		</>
	);
}
