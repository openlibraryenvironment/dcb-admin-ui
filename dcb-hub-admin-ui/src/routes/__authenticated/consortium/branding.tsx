import { createFileRoute, redirect } from "@tanstack/react-router";

import ConsortiumRecord from "@components/ConsortiumRecord/ConsortiumRecord";
import {
	CONSORTIUM_QUERY_KEY,
	CONSORTIUM_QUERY_VARIABLES,
} from "@/queryOptions/consortiumRecord";
import { createGraphQLClient } from "@helpers/createGraphQLClient";
import { getConsortia } from "@queries/getConsortia";
import type { LoadConsortiumQueryVariables } from "@generated/graphql";
import { isConsortiumBrandingEnabled } from "@helpers/featureFlags";

export const Route = createFileRoute("/__authenticated/consortium/branding")({
	// The tab is hidden while the flag is off, but the URL is still typeable - and this
	// page edits the six merged brand columns, which dcb-service does not have before
	// 9.0.0. Every save would be a validation error, and the loader below would not even
	// get that far.
	beforeLoad: () => {
		if (!isConsortiumBrandingEnabled()) {
			throw redirect({ to: "/consortium" });
		}
	},
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
				>(getConsortia(), CONSORTIUM_QUERY_VARIABLES),
		});
	},
	component: ConsortiumBrandingPage,
});

function ConsortiumBrandingPage() {
	return <ConsortiumRecord section="branding" />;
}
