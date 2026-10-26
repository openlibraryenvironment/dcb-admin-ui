import { queryOptions } from "@tanstack/react-query";
import type { GraphQLClient } from "graphql-request";
import type {
	GridFilterModel,
	GridPaginationModel,
	GridSortModel,
} from "@mui/x-data-grid-premium";

import { buildServerGridQueryVars } from "@helpers/dataGrid/utilities";

export interface ServerGridQueryArgs {
	/**
	 * The key's first element, which useEntityMutation's invalidation matches by prefix: the
	 * entity the rows are, not the grid showing them. docs/query-error-policy.md.
	 */
	root: string;
	gridId: string;
	document: string;
	filterModel: GridFilterModel;
	sortModel: GridSortModel;
	paginationModel: GridPaginationModel;
	defaultOrder: string;
	defaultPageSize: number;
	baseQuery?: string;
	quickFilterFields?: string[];
}

/** What a grid's view decides about the page it asks for. */
export type GridQueryModels = Pick<
	ServerGridQueryArgs,
	"filterModel" | "sortModel" | "paginationModel"
>;

/**
 * One page of a server-paged grid. A route's loader and its component both build the query
 * here, which is the only way the prefetch's key is the key the grid reads.
 */
export const serverGridQuery = (
	gqlClient: GraphQLClient,
	{ root, gridId, document, ...vars }: ServerGridQueryArgs,
) =>
	queryOptions({
		queryKey: [
			root,
			gridId,
			vars.paginationModel,
			vars.sortModel,
			vars.filterModel,
			vars.baseQuery ?? "",
		],
		queryFn: () =>
			// The documents' variable types differ; the variables are the same five
			gqlClient.request<any>(document, buildServerGridQueryVars(vars)),
		placeholderData: (previousData) => previousData,
	});
