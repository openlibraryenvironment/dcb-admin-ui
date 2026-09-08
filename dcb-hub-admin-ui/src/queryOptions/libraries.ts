import { queryOptions } from "@tanstack/react-query";
import { GraphQLClient } from "graphql-request";

import { getLibraries } from "@queries/getLibraries";
import { findConsortium } from "@helpers/findConsortium";
import type { LoadLibrariesQueryVariables } from "@generated/graphql";
import type { PatronRequestAutocompleteOption } from "@models/PatronRequestAutocompleteOption";

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
