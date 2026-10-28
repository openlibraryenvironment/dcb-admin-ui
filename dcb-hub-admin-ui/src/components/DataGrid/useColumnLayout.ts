import { useEffect, useRef, useState, type RefObject } from "react";
import {
	gridColumnFieldsSelector,
	type GridApiPremium,
	type GridColDef,
} from "@mui/x-data-grid-premium";

import type { ColumnLayout } from "@hooks/useGridView";

// MUI's own columns (`__check__`, `__detail_panel_toggle__`) are not the reader's to move
export const isOwnColumn = (field: string) => field.startsWith("__");

/**
 * Columns in this order; any the order does not name keep their relative places after it.
 * MUI's own columns keep their slots: the order never names them, so sorting them would put
 * the checkbox and the expander last.
 */
export const orderColumns = (
	columns: GridColDef[],
	order: readonly string[] | undefined,
) => {
	if (!order?.length) return columns;
	const rank = new Map(order.map((field, index) => [field, index]));
	const sorted = columns
		.filter((column) => !isOwnColumn(column.field))
		.sort(
			(a, b) =>
				(rank.get(a.field) ?? Number.MAX_SAFE_INTEGER) -
				(rank.get(b.field) ?? Number.MAX_SAFE_INTEGER),
		);
	let next = 0;
	return columns.map((column) =>
		isOwnColumn(column.field) ? column : sorted[next++],
	);
};

/**
 * A grid's pinning and order from its URL. The order is applied when the grid mounts, through
 * the columns it is given, and moved in place after that: a new columns array would reset the
 * widths the reader dragged. docs/url-view-state.md.
 */
export const useColumnLayout = (
	apiRef: RefObject<GridApiPremium | null>,
	columns: GridColDef[],
	layout: ColumnLayout | undefined,
	remountKey: string,
) => {
	const order = layout?.columnOrder;
	// Ordered only when the columns are new; an order change after that is matched in place below
	const [ordered, setOrdered] = useState(() => ({
		source: columns,
		columns: orderColumns(columns, order),
	}));
	if (ordered.source !== columns) {
		setOrdered({ source: columns, columns: orderColumns(columns, order) });
	}

	// Moves this grid makes to match the URL are not the reader's: they are not reported back
	const applying = useRef(false);
	const onColumnOrderChange = layout?.onColumnOrderChange;
	useEffect(() => {
		const api = apiRef.current;
		if (!api || !onColumnOrderChange) return;
		// Pinned columns are not in the order: MUI moves them to the front of its own list
		const report = () => {
			if (applying.current) return;
			onColumnOrderChange(
				gridColumnFieldsSelector(apiRef).filter(
					(field) => !isOwnColumn(field) && !api.isColumnPinned(field),
				),
			);
		};
		const stopDrag = api.subscribeEvent("columnOrderChange", report);
		const stopMove = api.subscribeEvent("columnIndexChange", report);
		return () => {
			stopDrag();
			stopMove();
		};
	}, [apiRef, onColumnOrderChange, remountKey]);

	const orderKey = JSON.stringify(order ?? []);
	// A pin or unpin moves columns in MUI's list: matched to the URL's order again after it
	const pinKey = JSON.stringify(layout?.pinnedColumns ?? null);
	useEffect(() => {
		const api = apiRef.current;
		if (!api) return;
		const current = gridColumnFieldsSelector(apiRef);
		// Only unpinned columns this grid renders: the order names every field its definition has,
		// and MUI keeps pinned columns at the front of its own list
		const movable = (field: string) =>
			!isOwnColumn(field) && !api.isColumnPinned(field);
		const present = new Set(current.filter(movable));
		const target = (JSON.parse(orderKey) as string[]).filter((field) =>
			present.has(field),
		);
		if (target.length === 0) return;
		const named = new Set(target);
		// The named columns take their slots in the target's order; every other column stays put
		let next = 0;
		const desired = current.map((field) =>
			named.has(field) ? target[next++] : field,
		);
		if (desired.every((field, index) => field === current[index])) return;
		applying.current = true;
		try {
			desired.forEach((field, index) => {
				if (gridColumnFieldsSelector(apiRef)[index] !== field)
					api.setColumnIndex(field, index);
			});
		} finally {
			applying.current = false;
		}
	}, [apiRef, orderKey, pinKey, remountKey]);

	return {
		columns: ordered.columns,
		pinnedColumns: layout?.pinnedColumns,
		onPinnedColumnsChange: layout?.onPinnedColumnsChange,
	};
};
