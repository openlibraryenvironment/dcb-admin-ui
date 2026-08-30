import { createFileRoute, Navigate, redirect } from "@tanstack/react-router";
import { Skeleton } from "@mui/material";

import PageContainer from "@layout/PageContainer/PageContainer";
import { useConsortiumSetup } from "@hooks/useConsortiumSetup";
import { useSetupStore } from "@hooks/useSetupStore";
import { createGraphQLClient } from "@helpers/createGraphQLClient";
import { getConsortia } from "@queries/getConsortia";
import { getLibraryCount } from "@queries/getLibraryCount";
import { LIBRARY_COUNT_QUERY_KEY } from "@/queryOptions/setup";
import {
	CONSORTIUM_SETUP_STEPS,
	evaluateConsortiumSetup,
} from "@helpers/consortiumSetup";
import { adminOrConsortiumAdmin } from "@constants/roles";
import type {
	LoadConsortiumQueryVariables,
	LoadLibrariesQueryVariables,
} from "@generated/graphql";

// Matched to useConsortiumSetup and to the consortium page, so this warms the entry they
// read rather than a parallel copy.
const CONSORTIUM_QUERY_KEY = ["LoadConsortium"];
const CONSORTIUM_QUERY_VARIABLES: LoadConsortiumQueryVariables = {
	order: "id",
	orderBy: "DESC",
};
const LIBRARY_COUNT_VARIABLES: LoadLibrariesQueryVariables = {
	query: "",
	pageno: 0,
	pagesize: 1,
	order: "fullName",
	orderBy: "ASC",
};

/**
 * `/setup` resolves to wherever the user actually is — W-4.
 *
 * Resolved in `beforeLoad` rather than by rendering a component that redirects in an
 * effect: the effect version paints a chapter, works out it is the wrong one, and
 * navigates away from it, which is a flash for everyone and a wrongly-announced heading
 * for a screen-reader user.
 */
export const Route = createFileRoute("/__authenticated/setup/")({
	beforeLoad: async ({ context: { queryClient, cfg, auth } }) => {
		// Unauthenticated visitors fall through to __authenticated's own redirect to
		// /login. Prefetching here would fire a tokenless request whose failure reaches
		// the global 401 handler first - the same trap every loader in this app notes.
		if (!auth?.isAuthenticated) return;

		const roles = (auth.user?.profile?.roles as string[]) || [];
		if (!roles.some((role) => adminOrConsortiumAdmin.includes(role))) {
			throw redirect({ to: "/unauthorised" });
		}

		const client = createGraphQLClient(cfg, auth);

		const [consortiumData, libraryCount] = await Promise.all([
			queryClient.ensureQueryData({
				queryKey: CONSORTIUM_QUERY_KEY,
				queryFn: () =>
					client.request<any, LoadConsortiumQueryVariables>(
						getConsortia,
						CONSORTIUM_QUERY_VARIABLES,
					),
			}),
			queryClient.ensureQueryData({
				queryKey: LIBRARY_COUNT_QUERY_KEY,
				queryFn: async () => {
					const response = await client.request<
						any,
						LoadLibrariesQueryVariables
					>(getLibraryCount, LIBRARY_COUNT_VARIABLES);
					return (response?.libraries?.totalSize ?? 0) as number;
				},
			}),
		]);

		const state = evaluateConsortiumSetup({
			consortium: (consortiumData as any)?.consortia?.content?.[0] ?? null,
			libraryCount: libraryCount as number,
			// Read imperatively: this runs outside React, and the skips are the only
			// part of progress the server does not know about.
			skipped: useSetupStore.getState().skipped,
		});

		throw redirect({
			to: "/setup/$step",
			params: {
				// A finished setup revisited from the Consortium tab opens at the
				// beginning rather than nowhere - the flow is also how appearance,
				// branding and functional settings are changed afterwards.
				step: state.firstIncompleteStep ?? CONSORTIUM_SETUP_STEPS[0],
			},
		});
	},

	// The cold-load path. `beforeLoad` above resolves the chapter on any in-app
	// navigation, but on a bookmarked or pasted /setup react-oidc-context has not yet
	// restored the session, so `isAuthenticated` is false, the guard takes its
	// "not signed in yet" branch and never redirects. Without a component that left
	// /setup rendering NOTHING - a blank page, which is how it was found.
	component: ResolveSetupStep,
});

/**
 * Send the user to wherever they actually are.
 *
 * A declarative `<Navigate>` rather than a `useEffect` that navigates: the effect version
 * is the pattern the routing rules ban, and it paints a frame of empty page first.
 */
function ResolveSetupStep() {
	const { state, isPending, isError } = useConsortiumSetup();

	if (isPending) {
		return (
			<PageContainer hideTitleBox hideBreadcrumbs>
				<Skeleton variant="rounded" height={420} />
			</PageContainer>
		);
	}

	// A failed read is not an empty instance; start at the beginning rather than
	// asserting the consortium is missing.
	const step =
		(!isError && state.firstIncompleteStep) ?? CONSORTIUM_SETUP_STEPS[0];

	return <Navigate to="/setup/$step" params={{ step }} replace />;
}
