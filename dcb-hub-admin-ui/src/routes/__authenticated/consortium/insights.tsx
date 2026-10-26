import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Box } from "@mui/material";

import PageContainer from "@layout/PageContainer/PageContainer";
import Loading from "@components/Loading/Loading";
import InsightsDashboard from "@components/Insights/InsightsDashboard";
import ScopeSelector from "@components/Insights/ScopeSelector";
import {
	scopeLibraryCode,
	scopeId,
	scopeOptionsFrom,
	selectedScope,
} from "@helpers/insightsScope";
import { createRestClient } from "@helpers/createRestClient";
import { createGraphQLClient } from "@helpers/createGraphQLClient";
import { isInsightsPageShown } from "@helpers/featureFlags";
import { rangeToParams, intervalForRange } from "@helpers/insightsRange";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import {
	allLibrariesQuery,
	insightsScopeOptionsQuery,
} from "@/queryOptions/libraries";

import {
	DEFAULT_RANGE,
	insightsSearchSchema,
	resolveSearch,
} from "@helpers/insightsSearch";
import { useInsightsView } from "@hooks/useInsightsView";
import {
	dashboardQueryOptions,
	timeSeriesQueryOptions,
	StatsParams,
} from "@helpers/statsApi";

export const Route = createFileRoute("/__authenticated/consortium/insights")({
	validateSearch: insightsSearchSchema,
	// The nav entry is hidden where the page is not shown, but the URL is still
	// typeable - and the page would call statistics endpoints that this
	// environment's dcb-service does not serve yet.
	beforeLoad: () => {
		if (!isInsightsPageShown("consortium")) {
			throw redirect({ to: "/consortium" });
		}
	},
	loader: async ({ context: { queryClient, cfg, auth }, location }) => {
		// Skip prefetch for unauthenticated visitors (see consortium/index loader).
		if (!auth?.isAuthenticated) return;

		// A fast path and NOT the guarantee - the guard above means this does not run
		// until OIDC has restored the session, so the component gates on the same list.
		// `location.search` rather than `loaderDeps`, which would re-run the loader on
		// every selection change. docs/insights-view-state.md.
		const scope = resolveSearch(
			insightsSearchSchema.parse(location.search),
		).scope;

		let libraryCode: string | undefined;
		if (scope.length > 0) {
			try {
				const libraries = await queryClient.ensureQueryData(
					allLibrariesQuery(createGraphQLClient(cfg, auth)),
				);
				// ensureQueryData returns the raw response - a `select` is a view for
				// components only - so the options are derived here.
				libraryCode = scopeLibraryCode(
					selectedScope(scopeOptionsFrom(libraries), scope),
				);
			} catch {
				// A library list that fails is not a reason to show nothing: the dashboard
				// falls back to the whole consortium and the selector says why.
				libraryCode = undefined;
			}
		}

		const client = createRestClient(cfg, auth);
		const params: StatsParams = {
			libraryCode,
			...rangeToParams(DEFAULT_RANGE),
		};
		const interval = intervalForRange(DEFAULT_RANGE);

		// Only the above-the-fold data: the combined KPI call + the trend chart. Every
		// other panel is lazy (fetches when scrolled into view), so we don't prefetch them.
		return Promise.all([
			queryClient.ensureQueryData(dashboardQueryOptions(client, params)),
			queryClient.ensureQueryData(
				timeSeriesQueryOptions(client, params, interval),
			),
		]);
	},
	component: ConsortiumInsightsPage,
});

function ConsortiumInsightsPage() {
	const { t } = useTranslation();
	const view = useInsightsView(Route.useSearch(), "/consortium/insights");
	const gqlClient = useGraphQLClient();

	// The URL carries the SELECTION - group:<id>, library:<id> - and the codes are resolved
	// from it, on the key the loader above resolved it on. Storing codes instead would
	// restore the figures and lose the chips.
	const {
		data: options = [],
		isLoading: scopeLoading,
		isError: scopeFailed,
	} = useQuery(insightsScopeOptionsQuery(gqlClient));

	const selected = useMemo(
		() => selectedScope(options, view.scope),
		[options, view.scope],
	);
	const libraryCode = useMemo(() => scopeLibraryCode(selected), [selected]);

	// A link that names a library has no question to ask until the codes are known, so the
	// dashboard is not mounted until then. A failed list counts as resolved - the figures
	// are consortium-wide and the selector says so - docs/insights-view-state.md.
	const scopeUnresolved =
		view.scope.length > 0 && options.length === 0 && !scopeFailed;

	return (
		<PageContainer
			title={t("insights.consortium.title")}
			subtitle={t("insights.consortium.subtitle")}
		>
			<Box sx={{ mb: 3 }}>
				<ScopeSelector
					options={options}
					value={selected}
					onChange={(next) => view.setScope(next.map(scopeId))}
					loading={scopeLoading}
					failed={scopeFailed}
				/>
			</Box>
			{scopeUnresolved ? (
				<Loading
					title={t("ui.info.loading.document", {
						document_type: t("insights.consortium.title"),
					})}
					subtitle={t("ui.info.wait")}
				/>
			) : (
				<InsightsDashboard
					libraryCode={libraryCode}
					view={view}
					subjectBarTo="/consortium/insights"
				/>
			)}
		</PageContainer>
	);
}
