import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { GraphQLClient } from "graphql-request";

import { getPatronRequestNotes } from "@queries/getPatronRequestNotes";
import { getPatronRequestTags } from "@queries/getPatronRequestTags";
import type {
	LoadPatronRequestNotesQuery,
	LoadPatronRequestNotesQueryVariables,
	LoadPatronRequestTagsQuery,
	LoadPatronRequestTagsQueryVariables,
} from "@generated/graphql";

/** dcb-service's own page limit for notes; a request holds at most 200, so four pages. */
export const NOTES_PAGE_SIZE = 50;

// Not under ["patronRequest", id]: a status action invalidates that, and need not refetch these
export const patronRequestNoteKeys = {
	notes: (patronRequestId: string) =>
		["patronRequestNotes", patronRequestId] as const,
	tags: (patronRequestId: string) =>
		["patronRequestTags", patronRequestId] as const,
};

// Libraries add notes and tags from their own app, so a revisit after this long fetches theirs
const NOTES_AND_TAGS_STALE_MS = 30 * 1000;

export const patronRequestNotesQuery = (
	gqlClient: GraphQLClient,
	patronRequestId: string,
) =>
	infiniteQueryOptions({
		queryKey: patronRequestNoteKeys.notes(patronRequestId),
		staleTime: NOTES_AND_TAGS_STALE_MS,
		initialPageParam: 0,
		queryFn: ({ pageParam }) =>
			gqlClient.request<
				LoadPatronRequestNotesQuery,
				LoadPatronRequestNotesQueryVariables
			>(getPatronRequestNotes, {
				query: `id:${patronRequestId}`,
				pageno: pageParam,
				pagesize: NOTES_PAGE_SIZE,
			}),
		getNextPageParam: (lastPage, pages, lastPageParam) => {
			const total =
				lastPage.patronRequests?.content?.[0]?.notes?.totalSize ?? 0;
			return pages.length * NOTES_PAGE_SIZE < total
				? lastPageParam + 1
				: undefined;
		},
	});

export const patronRequestTagsQuery = (
	gqlClient: GraphQLClient,
	patronRequestId: string,
) =>
	queryOptions({
		queryKey: patronRequestNoteKeys.tags(patronRequestId),
		staleTime: NOTES_AND_TAGS_STALE_MS,
		queryFn: () =>
			gqlClient.request<
				LoadPatronRequestTagsQuery,
				LoadPatronRequestTagsQueryVariables
			>(getPatronRequestTags, { query: `id:${patronRequestId}` }),
	});
