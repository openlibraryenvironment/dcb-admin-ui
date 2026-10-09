import { queryOptions } from "@tanstack/react-query";
import { GraphQLClient } from "graphql-request";

import { getLibraries } from "@queries/getLibraries";
import { getLibraryDirectory } from "@queries/getLibraryDirectory";
import { findConsortium } from "@helpers/findConsortium";
import type {
	LoadLibrariesQueryVariables,
	LoadLibraryDirectoryQueryVariables,
} from "@generated/graphql";
import type { PatronRequestAutocompleteOption } from "@models/PatronRequestAutocompleteOption";
import { nonCriticalQuery } from "@helpers/queryPolicy";

export interface LibraryAutocompleteOption extends PatronRequestAutocompleteOption {
	/** Library UUID. `value` is the agency code, which is what forms submit. */
	id?: string;
}

/**
 * The whole library list, sorted by name. Every consumer wanted exactly this
 * and asked for it under a different query key ("librariesInfo",
 * "allLibrariesDictionary", ["libraries","allSupplying"], ...), so the same
 * response was fetched and cached five separate times with three different
 * staleTimes. One key, one entry, one policy.
 */
const ALL_LIBRARIES_VARIABLES: LoadLibrariesQueryVariables = {
	query: "",
	pageno: 0,
	pagesize: 1000,
	order: "fullName",
	orderBy: "ASC",
};

export const allLibrariesQueryKey = ["libraries", "all"] as const;

export const allLibrariesQuery = (gqlClient: GraphQLClient) =>
	queryOptions({
		...nonCriticalQuery,
		queryKey: allLibrariesQueryKey,
		queryFn: () =>
			gqlClient.request<any, LoadLibrariesQueryVariables>(
				getLibraries,
				ALL_LIBRARIES_VARIABLES,
			),
		staleTime: 1000 * 60 * 30,
	});

/**
 * One mapper for every library dropdown. StaffRequest previously built two
 * near-identical arrays from the same data because one of them needed
 * `hostLmsCode` and the other did not; both are cheap, so both are always here.
 */
export const toLibraryOption = (library: any): LibraryAutocompleteOption => ({
	label: library.fullName,
	value: library.agencyCode,
	id: library.id,
	agencyId: library.agency?.id,
	hostLmsCode: library.agency?.hostLms?.code,
	functionalSettings: findConsortium(library?.membership)?.functionalSettings,
});

/**
 * Every library as a dropdown option. Use for item/supplying-library pickers
 * and anywhere the full list is the right list.
 */
export const libraryOptionsQuery = (gqlClient: GraphQLClient) =>
	queryOptions({
		...allLibrariesQuery(gqlClient),
		select: (data: any): LibraryAutocompleteOption[] =>
			(data?.libraries?.content ?? []).map(toLibraryOption),
	});

/**
 * The PATRON library dropdown for staff requesting and walk-up requesting.
 *
 * Borrowing-disabled libraries are excluded: a patron from an agency that
 * cannot borrow has nothing to request, so offering it only produces a request
 * the backend will refuse. `=== true` is deliberate - `isBorrowingAgency` is
 * nullable, and an agency nobody has configured has not been cleared to borrow.
 *
 * The filter is client-side because it cannot be pushed into the query. The
 * `libraries` data fetcher evaluates its Lucene string against `Library` via
 * `root.get(fieldName)` (LuceneFieldQueryNodeBuilder), a flat property lookup
 * with no dotted-path traversal and no join except two hardcoded special cases;
 * `isBorrowingAgency` lives on DataAgency, and the builder compares every value
 * as a String, so booleans do not work either. Filtering here costs nothing:
 * the full list is already fetched and cached for the other dropdowns.
 *
 * Deliberately NOT applied to the item/supplying library pickers, or to
 * expedited checkout - those are different questions about a library.
 */
export const borrowingLibraryOptionsQuery = (gqlClient: GraphQLClient) =>
	queryOptions({
		...allLibrariesQuery(gqlClient),
		select: (data: any): LibraryAutocompleteOption[] =>
			(data?.libraries?.content ?? [])
				.filter((library: any) => library.agency?.isBorrowingAgency === true)
				.map(toLibraryOption),
	});

/** One of a library's Host LMS systems, and the client class that names its ILS. */
export interface LocationHostLmsOption {
	code: string;
	lmsClientClass: string;
}

export interface LocationLibraryOption {
	label: string;
	id: string;
	agencyCode: string;
	/**
	 * One entry, or two for a library running a second Host LMS. A location belongs
	 * to exactly one of them, and which one decides whether its localId is required
	 * and in what shape - so a library with two has to be asked about.
	 */
	hostLms: LocationHostLmsOption[];
}

/**
 * The library picker for creating a location away from a library's own page.
 *
 * A second select over the one cached query rather than an option on toLibraryOption,
 * which carries no client CLASS - the thing getILS needs to decide a localId's rules.
 *
 * Libraries with no agency, or no Host LMS on it, are dropped: a location is created
 * against both codes, so one missing either can only produce a refused request.
 */
export const locationLibraryOptionsQuery = (gqlClient: GraphQLClient) =>
	queryOptions({
		...allLibrariesQuery(gqlClient),
		select: (data: any): LocationLibraryOption[] =>
			(data?.libraries?.content ?? [])
				.filter(
					(library: any) =>
						!!library.agencyCode && !!library.agency?.hostLms?.code,
				)
				.map((library: any) => ({
					label: library.fullName,
					id: library.id,
					agencyCode: library.agencyCode,
					hostLms: [
						{
							code: library.agency.hostLms.code,
							lmsClientClass: library.agency.hostLms.lmsClientClass,
						},
						...(library.secondHostLms?.code
							? [
									{
										code: library.secondHostLms.code,
										lmsClientClass: library.secondHostLms.lmsClientClass,
									},
								]
							: []),
					],
				})),
	});

/**
 * Codes to a library, for the pages that have a code and need a name.
 *
 * A SECOND projection of the same list, which the block above deliberately collapsed to
 * one - so the reason it earns its own key: `getLibraries` carries `clientConfig`, a JSON
 * scalar that cannot be sub-selected, for both of a library's Host LMS. A page that wants
 * three library names should not pull every member's Host LMS configuration to get them.
 *
 * `Library` exposes no flat field for a Host LMS code - `agency` and `secondHostLms` are
 * relations, and the `libraries` fetcher's Lucene builder does a flat `root.get(fieldName)`
 * with no traversal - so this mapping cannot be asked of the server one library at a time.
 * docs/query-error-policy.md, "Resolving a code to a library".
 */
const DIRECTORY_VARIABLES: LoadLibraryDirectoryQueryVariables = {
	query: "",
	pageno: 0,
	pagesize: 1000,
	order: "fullName",
	orderBy: "ASC",
};

export const libraryDirectoryQueryKey = ["libraries", "directory"] as const;

export const libraryDirectoryQuery = (gqlClient: GraphQLClient) =>
	queryOptions({
		...nonCriticalQuery,
		queryKey: libraryDirectoryQueryKey,
		queryFn: () =>
			gqlClient.request<any, LoadLibraryDirectoryQueryVariables>(
				getLibraryDirectory,
				DIRECTORY_VARIABLES,
			),
		// One request at the project's scale constant of hundreds of member libraries,
		// and half an hour, because a library's agency code does not move. Truncates
		// past 1,000 exactly as allLibrariesQuery does, and a truncated directory shows
		// a code where a name would be rather than anything worse.
		staleTime: 1000 * 60 * 30,
	});

/**
 * The agency code of the library whose Host LMS - either of them - carries this code.
 *
 * A select over the directory, so three of these on one page share one cache entry and
 * cost no requests between them.
 */
export const agencyCodeForHostLmsQuery = (
	gqlClient: GraphQLClient,
	hostLmsCode: string | undefined,
) =>
	queryOptions({
		...libraryDirectoryQuery(gqlClient),
		// The guard is load-bearing. Without it an undefined code - every render before
		// the patron request resolves - matches the first library that runs no second
		// Host LMS, because `secondHostLms?.code` is undefined too, and the page shows
		// a different library's name. libraryDirectory.test.ts.
		select: (data: any): string | undefined =>
			hostLmsCode
				? (data?.libraries?.content ?? []).find(
						(library: any) =>
							library?.agency?.hostLms?.code === hostLmsCode ||
							library?.secondHostLms?.code === hostLmsCode,
					)?.agencyCode
				: undefined,
	});
