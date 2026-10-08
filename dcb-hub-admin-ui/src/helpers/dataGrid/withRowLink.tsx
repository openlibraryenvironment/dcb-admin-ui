import {
	GridRowModes,
	type GridColDef,
	type GridRenderCellParams,
} from "@mui/x-data-grid-premium";

import Link from "@components/Link/Link";
import type { DataGridType } from "@constants/dataGrid/types";
import { resolveRowClickPath } from "@helpers/dataGrid/resolveRowClickPath";
import {
	firstLinkableField,
	gridRoutesOnRowClick,
} from "@helpers/dataGrid/rowLinkColumn";

/**
 * Makes the leading cell of a routing grid the row's link, so the row opens from
 * the keyboard. Why it has to be a link: docs/accessibility.md, "Reaching a detail
 * page".
 *
 * `onRowClick` is a pointer event and MUI X does not raise it for Enter, so until
 * this existed every detail page in the application was mouse-only.
 */
const asRowLink = (column: GridColDef, type: DataGridType): GridColDef => ({
	...column,
	renderCell: (params: GridRenderCellParams) => {
		const content = column.renderCell
			? column.renderCell(params)
			: params.formattedValue;

		// A link with no text has no accessible name, which is worse than no link:
		// it is a focus stop that announces nothing.
		if (content === null || content === undefined || content === "") {
			return content;
		}

		// No explicit tabIndex. GridCell focuses a child matching [tabindex="0"],
		// so mirroring params.tabIndex looks right and is worse: it makes every
		// unfocused row's link tabindex=-1 and tabbing then reaches none of them.
		// Measured both ways. Enter is handled by the grid's onCellKeyDown, which
		// is a public prop and does not depend on MUI's focus internals at all.
		const target = resolveRowClickPath(type, String(params.id));
		// Mid-edit the row is being changed, not navigated. handleDataGridRowClick
		// guards the pointer path on rowModesModel and the link has to agree.
		const editing = params.api.getRowMode?.(params.id) === GridRowModes.Edit;
		if (!target || editing) return content;

		return (
			<Link
				to={target}
				noLinkStyle
				// stopPropagation because onRowClick would otherwise navigate as well.
				// The anchor keeps ctrl/cmd-click working natively.
				onClick={(event) => event.stopPropagation()}
				sx={{
					// Inherits the cell's colour and truncation so no grid changes
					// appearance: the affordance a keyboard user needs is the focus
					// ring, which the anchor gets for free, not a second underline in
					// fifty grids.
					color: "inherit",
					display: "block",
					overflow: "hidden",
					textOverflow: "ellipsis",
					whiteSpace: "nowrap",
				}}
			>
				{content}
			</Link>
		);
	},
});

/** The grid's columns with its leading cell linked, where the grid routes at all. */
export const withRowLink = (
	columns: GridColDef[],
	type: DataGridType,
): GridColDef[] => {
	if (!gridRoutesOnRowClick(type)) return columns;

	const field = firstLinkableField(columns);
	if (!field) return columns;

	return columns.map((column) =>
		column.field === field ? asRowLink(column, type) : column,
	);
};
