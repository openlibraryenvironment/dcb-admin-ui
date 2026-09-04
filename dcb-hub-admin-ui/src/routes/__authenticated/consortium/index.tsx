import { createFileRoute } from "@tanstack/react-router";

import ConsortiumRecord from "@components/ConsortiumRecord/ConsortiumRecord";
import {
	CONSORTIUM_QUERY_KEY,
	CONSORTIUM_QUERY_VARIABLES,
} from "@/queryOptions/consortiumRecord";
import { createGraphQLClient } from "@helpers/createGraphQLClient";
import { getConsortia } from "@queries/getConsortia";
import type { LoadConsortiumQueryVariables } from "@generated/graphql";

export const Route = createFileRoute("/__authenticated/consortium/")({
	loader: ({ context: { queryClient, cfg, auth } }) => {
		// Skip prefetching for unauthenticated visitors - the request would fail (no
		// token) and its failure would trigger the global network/401 error handler in
		// main.tsx before __authenticated.tsx's own component-level auth-gate redirect
		// to /login ever runs.
		if (!auth?.isAuthenticated) return;
		return queryClient.ensureQueryData({
			queryKey: CONSORTIUM_QUERY_KEY,
			queryFn: () =>
				createGraphQLClient(cfg, auth).request<
					any,
					LoadConsortiumQueryVariables
				>(getConsortia, CONSORTIUM_QUERY_VARIABLES),
		});
	},
	component: ConsortiumProfilePage,
});

function ConsortiumProfilePage() {
	return <ConsortiumRecord section="profile" />;
}
