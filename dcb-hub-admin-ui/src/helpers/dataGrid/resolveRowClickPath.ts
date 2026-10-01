import {
	nonClickableTypes,
	rowClickRedirects,
	type DataGridType,
} from "@constants/dataGrid/types";

/**
 * Where a whole-row click on a grid of `type` takes a row with id `rowId`, or
 * undefined when that grid does not route.
 *
 * Kept apart from handleDataGridRowClick so navigationTargets.test.ts can resolve
 * every grid type in the app against the real route tree without pulling in the
 * data grid, and so the one decision - which URL a row opens - has one home.
 */
export const resolveRowClickPath = (
	type: DataGridType,
	rowId: string,
): string | undefined => {
	const redirect = rowClickRedirects[type];
	if (redirect) return redirect(rowId);
	if (nonClickableTypes.includes(type)) return undefined;
	return `/${type}/${rowId}`;
};
