import { queryOptions } from "@tanstack/react-query";
import { GraphQLClient } from "graphql-request";

import { getConsortiumBasics } from "@queries/getConsortiumBasics";
import type { LoadConsortiumHeaderQueryVariables } from "@generated/graphql";

/**
 * The one query that answers "is there a consortium yet". Very important for config
 *
 */
export const CONSORTIUM_BASICS_QUERY_KEY = ["consortiaKeyInfo"];

const CONSORTIUM_BASICS_VARIABLES: LoadConsortiumHeaderQueryVariables = {
	order: "name",
	orderBy: "ASC",
};

export const consortiumBasicsQuery = (
	gqlClient: GraphQLClient,
	enabled = true,
) =>
	queryOptions({
		queryKey: CONSORTIUM_BASICS_QUERY_KEY,
		enabled,
		throwOnError: false,
		queryFn: () =>
			gqlClient.request<any, LoadConsortiumHeaderQueryVariables>(
				getConsortiumBasics,
				CONSORTIUM_BASICS_VARIABLES,
			),
	});

export interface ConsortiumPresence {
	consortium: any | null;
	/**
	 * The consortium's own library group - its id only; see the query for why.
	 * Every member library belongs to it, so the new-library wizard adds them to
	 * it rather than leaving it as one more thing to remember.
	 */
	consortiumGroup: { id: string } | null;
	/**
	 * Undefined until the query has answered, and undefined if it failed.
	 *
	 * "No consortium", "not asked yet" and "could not ask" are three different
	 * things and only the first should ever put "create a consortium" in front
	 * of someone. Reading a failed request as "no consortium" is what made the
	 * whole app claim an already-configured instance was empty.
	 */
	hasConsortium: boolean | undefined;
}

/**
 * Accepts the query result rather than loose booleans, so a caller cannot
 * forget to pass the error state - which is exactly how the failure above
 * became invisible.
 */
export const readConsortiumPresence = (result: {
	data?: any;
	isPending: boolean;
	isError: boolean;
}): ConsortiumPresence => {
	if (result.isPending || result.isError)
		return {
			consortium: null,
			consortiumGroup: null,
			hasConsortium: undefined,
		};

	const consortium = result.data?.consortia?.content?.[0] ?? null;
	return {
		consortium,
		consortiumGroup: consortium?.libraryGroup?.id
			? { id: consortium.libraryGroup.id }
			: null,
		hasConsortium: !!consortium,
	};
};
