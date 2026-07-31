import { QueryClient } from "@tanstack/react-query";

/**
 * Invalidate every cached patron-request list/detail after a status-changing
 * action (cleanup, rollback) so the new status shows up without a manual reload.
 *
 * A prefix predicate rather than a fixed key list: the grids do not share one
 * query key - the main grids are keyed on "patronRequestsDashboard", the library
 * grids on their gridId ("patronRequestsLibraryActive", …), the detail page on
 * "patronRequest", the tab counts on "patronRequestTotals". They all begin with
 * "patronRequest", so one predicate refreshes whichever grid (and the detail
 * page, and the tab totals) is currently mounted, and cannot silently miss one
 * the way an enumerated list would when a new grid is added.
 */
export const invalidatePatronRequestQueries = (queryClient: QueryClient) =>
	queryClient.invalidateQueries({
		predicate: (query) => {
			const key = query.queryKey[0];
			return typeof key === "string" && key.startsWith("patronRequest");
		},
	});
