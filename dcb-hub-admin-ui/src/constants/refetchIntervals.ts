/**
 * How often an open detail page asks again.
 *
 * One constant rather than the same literal at eleven call sites, so a reader can tell
 * these pages are deliberately in step rather than coincidentally the same number.
 */
export const DETAIL_REFETCH_MS = 120000;

/**
 * The same interval, paused while a form on the page is being edited.
 *
 * Three detail pages feed react-hook-form through its `values` prop, which re-syncs the
 * form when that data CHANGES - so a poll landing mid-edit, on a record somebody else has
 * moved, replaces the half-typed field. An identical payload is a no-op, which is why the
 * e2e for it has to move the record. `hostlmss/$hostlmsId` guarded against this and said
 * so; `libraries/$libraryId` and its service tab did not.
 */
export const detailRefetchInterval = (editing: boolean): number | false =>
	editing ? false : DETAIL_REFETCH_MS;
