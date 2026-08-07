import { queryOptions } from "@tanstack/react-query";
import { GraphQLClient } from "graphql-request";

import { getLocationForPatronRequestGrid } from "@queries/getLocationForPatronRequestGrid";
import type { LoadLocationForPrGridQueryVariables } from "@generated/graphql";

const PAGE_SIZE = 100;

/**
 * Every location, for the patron-request grids' pickup-location lookup.
 *
 * This replaces TWO implementations of the same thing. One issued a single
 * request with `pagesize: 1000` and returned the raw response; the other -
 * copy-pasted into five files as a local `fetchAllLocations` - paged through
 * the whole set and returned a flat array. They disagreed about the shape AND
 * about correctness: the single-shot version silently truncates the moment a
 * consortium has more than a thousand locations, and nothing would have told
 * anyone except a pickup location rendering as a bare UUID.
 *
 * The paging version wins, and everything now gets the flat array.
 */
export const allLocationsQueryKey = ["locations", "all"] as const;

export const fetchAllLocations = async (gqlClient: GraphQLClient) => {
	const variables = {
		query: "",
		order: "name",
		orderBy: "ASC",
		pagesize: PAGE_SIZE,
	};

	const firstPage = await gqlClient.request<
		any,
		LoadLocationForPrGridQueryVariables
	>(getLocationForPatronRequestGrid, { ...variables, pageno: 0 });

	const locations = [...(firstPage?.locations?.content ?? [])];
	const totalSize = firstPage?.locations?.totalSize ?? 0;
	if (locations.length >= totalSize) return locations;

	// Remaining pages in parallel: they are independent reads and the grid
	// cannot render a partial lookup table usefully anyway.
	const remainingPages = Array.from(
		{ length: Math.ceil(totalSize / PAGE_SIZE) - 1 },
		(_, index) =>
			gqlClient.request<any, LoadLocationForPrGridQueryVariables>(
				getLocationForPatronRequestGrid,
				{ ...variables, pageno: index + 1 },
			),
	);

	const results = await Promise.all(remainingPages);
	results.forEach((result) => {
		locations.push(...(result?.locations?.content ?? []));
	});
	return locations;
};

export const allLocationsQuery = (gqlClient: GraphQLClient) =>
	queryOptions({
		queryKey: allLocationsQueryKey,
		queryFn: () => fetchAllLocations(gqlClient),
		staleTime: 1000 * 60 * 30,
	});
