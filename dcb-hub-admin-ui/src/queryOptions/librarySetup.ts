import { queryOptions } from "@tanstack/react-query";
import { GraphQLClient } from "graphql-request";

import { getMappings } from "@queries/getMappings";
import { getLocations } from "@queries/getLocations";
import { getNumericRangeMappings } from "@queries/getNumericRangeMappings";
import {
	requiresNumericRangeMappings,
	type LibrarySetupCounts,
} from "@helpers/librarySetup";
import type {
	LoadLocationsQueryVariables,
	LoadMappingsQueryVariables,
	LoadNumericRangeMappingsQueryVariables,
} from "@generated/graphql";

/**
 * How many of each configuration record a library has. Every request asks for
 * `pagesize: 1` because only `totalSize` is wanted - this counts, it does not
 * fetch.
 *
 * The onboarding grid runs the same counts for every library at once; this is
 * the single-library version the library page needs to decide whether to offer
 * "finish setup".
 */
const countMappings = async (
	gqlClient: GraphQLClient,
	hostLmsCode: string,
	category: string,
) => {
	const response = await gqlClient.request<any, LoadMappingsQueryVariables>(
		getMappings,
		{
			query: `(toContext:"${hostLmsCode}" OR fromContext:"${hostLmsCode}") AND (toCategory:"${category}" OR fromCategory:"${category}") AND NOT deleted:true`,
			order: "id",
			orderBy: "ASC",
			pageno: 0,
			pagesize: 1,
		},
	);
	return response?.referenceValueMappings?.totalSize ?? 0;
};

export const fetchLibrarySetupCounts = async (
	gqlClient: GraphQLClient,
	library: any,
): Promise<LibrarySetupCounts> => {
	const hostLmsCode = library?.agency?.hostLms?.code;
	const hostLmsId = library?.agency?.hostLms?.id;
	const needsNumeric = requiresNumericRangeMappings(library);

	// Without a Host LMS nothing is configurable yet, and the queries would be
	// built from `undefined`.
	if (!hostLmsCode || !hostLmsId) {
		return {
			itemTypeMappingCount: 0,
			patronTypeMappingCount: 0,
			locationMappingCount: 0,
			pickupLocationCount: 0,
			numericRangeMappingCount: needsNumeric ? 0 : null,
		};
	}

	const [itemType, patronType, location, pickup, numericRange] =
		await Promise.all([
			countMappings(gqlClient, hostLmsCode, "ItemType"),
			countMappings(gqlClient, hostLmsCode, "patronType"),
			countMappings(gqlClient, hostLmsCode, "Location"),
			gqlClient
				.request<any, LoadLocationsQueryVariables>(getLocations, {
					// Specifically pickup-enabled: a library with locations but none
					// available for pickup cannot receive a request.
					query: `hostSystem: ${hostLmsId} AND isPickup: true`,
					order: "code",
					orderBy: "ASC",
					pageno: 0,
					pagesize: 1,
				})
				.then((response) => response?.locations?.totalSize ?? 0),
			needsNumeric
				? gqlClient
						.request<any, LoadNumericRangeMappingsQueryVariables>(
							getNumericRangeMappings,
							{
								query: `context:"${hostLmsCode}" AND NOT deleted:true`,
								order: "id",
								orderBy: "ASC",
								pageno: 0,
								pagesize: 1,
							},
						)
						.then((response) => response?.numericRangeMappings?.totalSize ?? 0)
				: Promise.resolve(null),
		]);

	return {
		itemTypeMappingCount: itemType,
		patronTypeMappingCount: patronType,
		locationMappingCount: location,
		pickupLocationCount: pickup,
		numericRangeMappingCount: numericRange,
	};
};

/**
 * Keyed under "library" so the entity registry's prefix sweep refreshes it:
 * importing mappings or adding a pickup location changes the answer, and the
 * banner must stop offering a step the user has just finished.
 */
export const librarySetupCountsQuery = (
	gqlClient: GraphQLClient,
	library: any,
) =>
	queryOptions({
		queryKey: ["library", "setupCounts", library?.id],
		queryFn: () => fetchLibrarySetupCounts(gqlClient, library),
		enabled: !!library?.id,
		staleTime: 1000 * 30,
	});
