import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Box } from "@mui/material";

import PageContainer from "@layout/PageContainer/PageContainer";
import InsightsDashboard from "@components/Insights/InsightsDashboard";
import ScopeSelector, { ScopeOption } from "@components/Insights/ScopeSelector";
import { scopeId } from "@helpers/insightsScope";
import { createRestClient } from "@helpers/createRestClient";
import { isInsightsEnabled } from "@helpers/featureFlags";
import { rangeToParams, intervalForRange } from "@helpers/insightsRange";

import { insightsSearchSchema } from "@helpers/insightsSearch";
import { useInsightsView } from "@hooks/useInsightsView";
import {
	dashboardQueryOptions,
	timeSeriesQueryOptions,
	StatsParams,
} from "@helpers/statsApi";

// Must mirror insightsPlotStore's default preset so the prefetched keys match the
// component's first render.
const DEFAULT_PRESET = "30d" as const;

export const Route = createFileRoute("/__authenticated/consortium/insights")({
	validateSearch: insightsSearchSchema,
	// The nav entry is hidden while the flag is off, but the URL is still
	// typeable - and the page would call statistics endpoints that this
	// environment's dcb-service does not serve yet.
	beforeLoad: () => {
		if (!isInsightsEnabled()) {
			throw redirect({ to: "/consortium" });
		}
	},
	loader: ({ context: { queryClient, cfg, auth } }) => {
		// Skip prefetch for unauthenticated visitors (see consortium/index loader).
		if (!auth?.isAuthenticated) return;

		const client = createRestClient(cfg, auth);
		const params: StatsParams = { ...rangeToParams(DEFAULT_PRESET) };
		const interval = intervalForRange(DEFAULT_PRESET);

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

	// The URL carries the SELECTION - group:<id>, library:<id> - and the codes are resolved
	// from it once the library list arrives. Storing codes instead would restore the
	// figures and lose the chips, and a group that gained a member would quietly mean
	// something different on reload.
	const [options, setOptions] = useState<ScopeOption[]>([]);
	const selected = useMemo(
		() => options.filter((option) => view.scope.includes(scopeId(option))),
		[options, view.scope],
	);

	// Union of the selected libraries' / groups' Host LMS codes -> CSV. Empty = whole consortium.
	const libraryCode = useMemo(() => {
		const codes = new Set<string>();
		selected.forEach((option) => option.codes.forEach((c) => codes.add(c)));
		return codes.size ? Array.from(codes).join(",") : undefined;
	}, [selected]);

	return (
		<PageContainer
			title={t("insights.consortium.title")}
			subtitle={t("insights.consortium.subtitle")}
		>
			<Box sx={{ mb: 3 }}>
				<ScopeSelector
					value={selected}
					onChange={(next) => view.setScope(next.map(scopeId))}
					onOptionsLoaded={setOptions}
				/>
			</Box>
			<InsightsDashboard libraryCode={libraryCode} view={view} />
		</PageContainer>
	);
}
