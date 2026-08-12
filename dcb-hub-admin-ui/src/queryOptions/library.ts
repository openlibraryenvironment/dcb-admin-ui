import { queryOptions } from "@tanstack/react-query";
import { GraphQLClient } from "graphql-request";

import { getLibrary } from "@queries/getLibrary";
import { getLibraryBasics } from "@queries/getLibraryBasics";
import type {
	LoadLibraryQueryVariables,
	LoadLibraryBasicsQueryVariables,
} from "@generated/graphql";

/**
 * A single library, by UUID. Eighteen route files opened with a byte-identical
 * copy of this useQuery block followed by the same
 * `data?.libraries?.content?.[0]` unwrap; the `select` here does that unwrap
 * once, so callers get the library itself.
 *
 * The key and the fetcher are exported separately because route loaders
 * prefetch through `queryClient.ensureQueryData`, which takes fetch options
 * rather than full query options - they must agree with what the component
 * reads, and the only way to guarantee that is for both to come from here.
 */
export const libraryQueryKey = (libraryId: string) =>
	["library", libraryId] as const;

export const fetchLibrary = (gqlClient: GraphQLClient, libraryId: string) =>
	gqlClient.request<any, LoadLibraryQueryVariables>(getLibrary, {
		query: `id:${libraryId}`,
	});

export const libraryQuery = (gqlClient: GraphQLClient, libraryId: string) =>
	queryOptions({
		queryKey: libraryQueryKey(libraryId),
		queryFn: () => fetchLibrary(gqlClient, libraryId),
		enabled: !!libraryId,
		select: (data: any) => data?.libraries?.content?.[0],
	});

/**
 * The lighter `getLibraryBasics` projection, looked up by agency code - what
 * the patron-request and bib pages need when all they have is a code.
 *
 * `scope` keeps otherwise-identical lookups in separate cache entries when a
 * page resolves several libraries at once (a patron request has a supplying,
 * a pickup and a patron library, and they are not the same record).
 */
export const libraryBasicsByAgencyCodeQuery = (
	gqlClient: GraphQLClient,
	agencyCode: string | undefined,
	scope: string,
) =>
	queryOptions({
		queryKey: ["library", scope, agencyCode],
		queryFn: () =>
			gqlClient.request<any, LoadLibraryBasicsQueryVariables>(
				getLibraryBasics,
				{ query: `agencyCode:${agencyCode}` },
			),
		enabled: !!agencyCode,
		select: (data: any) => data?.libraries?.content?.[0],
	});

/** The same projection, by UUID. */
export const libraryBasicsQuery = (
	gqlClient: GraphQLClient,
	libraryId: string,
	scope: string,
) =>
	queryOptions({
		queryKey: ["library", scope, libraryId],
		queryFn: () =>
			gqlClient.request<any, LoadLibraryBasicsQueryVariables>(
				getLibraryBasics,
				{ query: `id:${libraryId}` },
			),
		enabled: !!libraryId,
		select: (data: any) => data?.libraries?.content?.[0],
	});
