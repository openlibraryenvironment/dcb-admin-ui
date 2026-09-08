import { queryOptions } from "@tanstack/react-query";
import { GraphQLClient } from "graphql-request";

import { getLibraryCount } from "@queries/getLibraryCount";
import type { LoadLibrariesQueryVariables } from "@generated/graphql";

/**
 * The library count that feeds the setup progress rail — W-5.
 *
 * Its own key, deliberately separate from `["LoadLibraries", ...]`: that key is owned by
 * the grids and carries their pagination, sort and filter models, so sharing it would make
 * the rail's answer depend on whichever grid rendered last.
 */
export const LIBRARY_COUNT_QUERY_KEY = ["LoadLibraryCount"];

const LIBRARY_COUNT_VARIABLES: LoadLibrariesQueryVariables = {
	query: "",
	pageno: 0,
	// Only totalSize is read; see the query for why this is 1 and not 0.
	pagesize: 1,
	order: "fullName",
	orderBy: "ASC",
};

export const libraryCountQuery = (gqlClient: GraphQLClient, enabled = true) =>
	queryOptions({
		queryKey: LIBRARY_COUNT_QUERY_KEY,
		enabled,
		/**
		 * Sixty seconds. This number only changes when the person looking at it adds a
		 * library, and the chapter that does so invalidates this key on success - so the
		 * staleness window is a backstop for another administrator's work, not the
		 * mechanism by which the rail updates. A `staleTime` of 0 would refetch a count
		 * on every chapter navigation for no new information.
		 */
		staleTime: 60 * 1000,
		queryFn: async () => {
			const response = await gqlClient.request<
				any,
				LoadLibrariesQueryVariables
			>(getLibraryCount, LIBRARY_COUNT_VARIABLES);
			return (response?.libraries?.totalSize ?? 0) as number;
		},
	});
