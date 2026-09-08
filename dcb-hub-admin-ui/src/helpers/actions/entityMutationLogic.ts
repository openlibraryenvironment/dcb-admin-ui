import { GridRowModel } from "@mui/x-data-grid-premium";

/**
 * The decisions `useEntityMutation` makes that are not about React. Kept out of
 * the hook so they can be tested directly - the project's Vitest setup has no
 * DOM, and these are the parts where being wrong is silent rather than loud.
 */

/**
 * The fields a grid row edit actually changed. MUI hands `processRowUpdate`
 * both versions of the row; sending the whole thing would overwrite fields the
 * user never touched with whatever the grid happened to be displaying.
 */
export const changedRowFields = (
	newRow: GridRowModel,
	oldRow: GridRowModel,
): Record<string, unknown> =>
	Object.keys(newRow).reduce<Record<string, unknown>>((changed, key) => {
		if (newRow[key] !== oldRow[key]) changed[key] = newRow[key];
		return changed;
	}, {});

/**
 * Did a delete actually happen?
 *
 * The mutations return `{ success, message }`, and a `success: false` with a
 * 200 response is the server declining - not an error the request layer will
 * throw for. Treat a missing field as success, because some deletes return
 * nothing at all; treat an explicit `false` as failure, because that is the
 * server saying so.
 */
export const readDeleteOutcome = (
	response: any,
	operation: string | undefined,
): { success: boolean; message?: string } => {
	if (!operation) return { success: true };
	const result = response?.[operation];
	return {
		success: result?.success ?? true,
		message: result?.message,
	};
};
