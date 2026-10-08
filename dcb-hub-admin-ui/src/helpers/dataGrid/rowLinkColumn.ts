import type { GridColDef } from "@mui/x-data-grid-premium";

import type { DataGridType } from "@constants/dataGrid/types";
import { resolveRowClickPath } from "@helpers/dataGrid/resolveRowClickPath";

/**
 * Grid-internal columns that are not the row's name and must never become its link.
 * `__check__` is the selection checkbox, `__detail_panel_toggle__` the expander.
 */
const NOT_A_NAME = new Set([
	"__check__",
	"__detail_panel_toggle__",
	"__reorder__",
	"actions",
]);

/** Whether a whole-row click on this grid goes anywhere. */
export const gridRoutesOnRowClick = (type: DataGridType): boolean =>
	// A probe id: resolveRowClickPath answers per TYPE, and the id only fills the
	// template. Any non-empty value gives the same answer.
	resolveRowClickPath(type, "probe") !== undefined;

/**
 * The column whose cell becomes the row's link: the first one a reader actually
 * sees, which is the cell they would click.
 *
 * Returns undefined when the grid has no such column, so the caller leaves it
 * alone rather than guessing.
 */
export const firstLinkableField = (columns: GridColDef[]): string | undefined =>
	columns.find(
		(column) => column.type !== "actions" && !NOT_A_NAME.has(column.field),
	)?.field;
