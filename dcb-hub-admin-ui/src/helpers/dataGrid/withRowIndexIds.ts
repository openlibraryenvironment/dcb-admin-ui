/**
 * Gives rows from `/sql` the `id` MUI X requires.
 *
 * `GenericSelectService` returns whatever columns the named query happens to
 * select, as `hits`. None of the 56 named queries selects an `id`, so a grid fed
 * these rows directly makes MUI THROW - `checkGridRowIdIsValid` raises "requires
 * all rows to have a unique `id` property" - and the route dies to the error
 * boundary as soon as the query matches anything. docs/sql-backed-grids.md.
 *
 * The index is the only key available: the column set differs per query, so
 * nothing else is common to all 56. It is sound here because these grids are
 * read-only - no selection, no row editing - so row identity never has to survive
 * a refetch.
 */
export const withRowIndexIds = <T extends object>(
	rows: T[] | undefined | null,
): (T & { id: number })[] =>
	(rows ?? []).map((row, index) => ({ ...row, id: index }));
