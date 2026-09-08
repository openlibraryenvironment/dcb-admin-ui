import { useQuery } from "@tanstack/react-query";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useSetupStore } from "@hooks/useSetupStore";
import { libraryCountQuery } from "@/queryOptions/setup";
import { getConsortia } from "@queries/getConsortia";
import {
	evaluateConsortiumSetup,
	type ConsortiumSetupState,
} from "@helpers/consortiumSetup";
import type { LoadConsortiumQueryVariables } from "@generated/graphql";

// The consortium page's key and variables, matched exactly so the setup flow warms and
// reads the SAME cache entry rather than a parallel copy that drifts from it.
const CONSORTIUM_QUERY_KEY = ["LoadConsortium"];
const CONSORTIUM_QUERY_VARIABLES: LoadConsortiumQueryVariables = {
	order: "id",
	orderBy: "DESC",
};

export interface UseConsortiumSetupResult {
	state: ConsortiumSetupState;
	consortium: any | null;
	/** The consortium's own library group. `createLibrary` needs it to add members. */
	consortiumGroupId: string | null;
	libraryCount: number;
	/**
	 * True until every input has answered. Nothing about progress may be rendered while
	 * this is set: flashing "you have not set up a consortium" at somebody whose
	 * consortium is fine, for the half-second before the query lands, is worse than a
	 * moment's silence. `LibrarySetupBanner` learned this the same way.
	 */
	isPending: boolean;
	/**
	 * True when an input failed. Distinct from "not set up": reading a failed request as
	 * an empty instance is exactly the defect `readConsortiumPresence` was written to
	 * stop, and it made a configured deployment claim it was empty.
	 */
	isError: boolean;
}

/**
 * How far through setup this deployment is — W-5.
 *
 * Reads the consortium (its full record, for contacts, functional settings and brand) plus
 * a library count, and folds in the skips held locally. Every consumer - the progress rail,
 * the home-page banner, the finish screen, the first-run redirect - goes through here, so
 * they cannot disagree about how far along a deployment is.
 */
export function useConsortiumSetup(): UseConsortiumSetupResult {
	const gqlClient = useGraphQLClient();
	const skipped = useSetupStore((s) => s.skipped);

	const consortiumResult = useQuery({
		queryKey: CONSORTIUM_QUERY_KEY,
		queryFn: () =>
			gqlClient.request<any, LoadConsortiumQueryVariables>(
				getConsortia(),
				CONSORTIUM_QUERY_VARIABLES,
			),
		// A missing consortium is an ANSWER here, not a failure, and the flow renders it
		// as the first thing to do. Letting it reach the router's error boundary would
		// put an error page in front of every genuinely new deployment.
		throwOnError: false,
	});

	// Always asked, never gated on the consortium existing. Libraries can precede it:
	// dcb-service/scripts/libraries_setup.sh imports the membership FIRST and creates the
	// consortium afterwards, so an instance with 60 libraries and no consortium is a real
	// state this flow has to describe correctly. Gating it would also pin `isPending`
	// high forever, because a disabled query never leaves the pending status.
	const countResult = useQuery(libraryCountQuery(gqlClient));

	const consortium =
		(consortiumResult.data?.consortia?.content?.[0] as any) ?? null;

	return {
		state: evaluateConsortiumSetup({
			consortium,
			libraryCount: countResult.data ?? 0,
			skipped,
		}),
		consortium,
		consortiumGroupId: consortium?.libraryGroup?.id ?? null,
		libraryCount: countResult.data ?? 0,
		isPending: consortiumResult.isPending || countResult.isPending,
		isError: consortiumResult.isError || countResult.isError,
	};
}
