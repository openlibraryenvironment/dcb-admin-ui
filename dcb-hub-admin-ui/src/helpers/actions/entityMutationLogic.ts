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
/**
 * Drop every key this deployment's dcb-service cannot accept — R-19.
 *
 * An undeclared input field is a GraphQL VALIDATION error, so one key too new for the
 * server fails the whole mutation rather than being ignored. The consortium form has
 * always stripped its own; doing it here instead means an entity gains a version-gated
 * field by adding it to the capability registry, and not by remembering to filter it at
 * every call site that writes one.
 *
 * `unsupported` is passed in rather than read from the registry so this stays a pure
 * function: the flags live on `window`, which the test environment does not have.
 */
export const stripUnsupportedKeys = <T extends Record<string, unknown>>(
	input: T,
	unsupported: ReadonlySet<string>,
): Partial<T> =>
	Object.fromEntries(
		Object.entries(input).filter(([key]) => !unsupported.has(key)),
	) as Partial<T>;

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
