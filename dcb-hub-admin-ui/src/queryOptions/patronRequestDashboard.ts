import { queryOptions } from "@tanstack/react-query";
import { GraphQLClient } from "graphql-request";
import type {
	GridFilterModel,
	GridPaginationModel,
	GridSortModel,
} from "@mui/x-data-grid-premium";

import { getPatronRequestDashboard } from "@queries/getPatronRequestDashboard";
import { queries } from "@constants/patronRequestGridQueries";
import { buildServerGridQueryVars } from "@helpers/dataGrid/utilities";
import type { GetPatronRequestDashboardQueryVariables } from "@generated/graphql";

/** One page of rows, its filtered total, and the four unfiltered tab counts. */
export interface PatronRequestDashboard {
	rows: any[];
	/** The row total WITH the user's filters applied. */
	totalSize: number;
	/** Bucket totals WITHOUT them, which is what the tab bar counts. */
	counts: {
		exception: number;
		outOfSequence: number;
		inProgress: number;
		finished: number;
	};
}

/**
 * A patron request list page: its rows and every tab count, in one request.
 *
 * `allQuery` names the ROWS this page lists, not the "all" bucket - four of the five
 * callers list one bucket. docs/query-error-policy.md, "One request per list page".
 */
export const patronRequestDashboardQuery = (
	gqlClient: GraphQLClient,
	args: {
		gridId: string;
		baseQuery: string;
		paginationModel: GridPaginationModel;
		sortModel: GridSortModel;
		filterModel: GridFilterModel;
	},
) =>
	queryOptions({
		// Rooted on "patronRequestsDashboard" so invalidatePatronRequestQueries, which
		// matches any key starting "patronRequest", still refreshes these after a
		// status-changing action.
		queryKey: [
			"patronRequestsDashboard",
			args.gridId,
			args.baseQuery,
			args.paginationModel,
			args.sortModel,
			args.filterModel,
		],
		queryFn: () => {
			const gridVars = buildServerGridQueryVars({
				filterModel: args.filterModel,
				sortModel: args.sortModel,
				paginationModel: args.paginationModel,
				baseQuery: args.baseQuery,
				defaultOrder: "dateCreated",
				defaultPageSize: 20,
			});
			return gqlClient.request<any, GetPatronRequestDashboardQueryVariables>(
				getPatronRequestDashboard,
				{
					allQuery: gridVars.query,
					activeQuery: queries.inProgress,
					exceptionQuery: queries.exception,
					outOfSequenceQuery: queries.outOfSequence,
					finishedQuery: queries.finished,
					pageno: gridVars.pageno,
					pagesize: gridVars.pagesize,
					order: gridVars.order,
					orderBy: gridVars.orderBy,
				},
			);
		},
		placeholderData: (previousData) => previousData,
		select: (data: any): PatronRequestDashboard => ({
			rows: data?.allRequests?.content ?? [],
			totalSize: data?.allRequests?.totalSize ?? 0,
			counts: {
				exception: data?.exceptionRequests?.totalSize ?? 0,
				outOfSequence: data?.outOfSequenceRequests?.totalSize ?? 0,
				inProgress: data?.activeRequests?.totalSize ?? 0,
				finished: data?.finishedRequests?.totalSize ?? 0,
			},
		}),
	});
