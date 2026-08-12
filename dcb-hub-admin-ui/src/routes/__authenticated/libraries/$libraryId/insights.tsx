import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Box, Typography } from "@mui/material";

import PageContainer from "@layout/PageContainer/PageContainer";
import LibraryTabs from "@components/LibraryTabs/LibraryTabs";
import Loading from "@components/Loading/Loading";
import ErrorComponent from "@components/Error/Error";
import InsightsDashboard from "@components/Insights/InsightsDashboard";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { createGraphQLClient } from "@helpers/createGraphQLClient";
import { createRestClient } from "@helpers/createRestClient";
import { isInsightsEnabled } from "@helpers/featureFlags";
import {
	fetchLibrary,
	libraryQuery,
	libraryQueryKey,
} from "@/queryOptions/library";
import { libraryParamsSchema } from "@schemas/routeParams/libraryParams";
import { rangeToParams, intervalForRange } from "@helpers/insightsRange";
import {
	dashboardQueryOptions,
	timeSeriesQueryOptions,
	StatsParams,
} from "@helpers/statsApi";

// Must mirror insightsPlotStore's default preset so the prefetched keys match.
const DEFAULT_PRESET = "30d" as const;

// The stats endpoints filter on a Host LMS code (patron_hostlms_code), which for a
// library is Library.agency.hostLms.code - resolved from the library record here.
function hostLmsCodeOf(library: any): string | undefined {
	return library?.agency?.hostLms?.code;
}

export const Route = createFileRoute(
	"/__authenticated/libraries/$libraryId/insights",
)({
	params: {
		parse: (raw) => libraryParamsSchema.parse(raw),
	},
	// The tab is hidden while the flag is off, but the URL is still typeable -
	// and the page would call statistics endpoints that this environment's
	// dcb-service does not serve yet.
	beforeLoad: ({ params: { libraryId } }) => {
		if (!isInsightsEnabled()) {
			throw redirect({
				to: "/libraries/$libraryId",
				params: { libraryId },
			});
		}
	},
	loader: async ({
		context: { queryClient, cfg, auth },
		params: { libraryId },
	}) => {
		if (!auth?.isAuthenticated) return;

		// Load the library first (shared cache key with the other library pages),
		// then derive its Host LMS code before prefetching the stats.
		// ensureQueryData returns the raw response (a `select` is a view for
		// components only), so unwrap here before deriving the code.
		const libraryData = await queryClient.ensureQueryData({
			queryKey: libraryQueryKey(libraryId),
			queryFn: () => fetchLibrary(createGraphQLClient(cfg, auth), libraryId),
		});

		const libraryCode = hostLmsCodeOf(
			(libraryData as any)?.libraries?.content?.[0],
		);
		if (!libraryCode) return;

		const client = createRestClient(cfg, auth);
		const params: StatsParams = {
			libraryCode,
			...rangeToParams(DEFAULT_PRESET),
		};
		const interval = intervalForRange(DEFAULT_PRESET);

		// Above-the-fold only: combined KPI call + trend. The rest are lazy panels.
		return Promise.all([
			queryClient.ensureQueryData(dashboardQueryOptions(client, params)),
			queryClient.ensureQueryData(
				timeSeriesQueryOptions(client, params, interval),
			),
		]);
	},
	component: LibraryInsights,
});

function LibraryInsights() {
	const { t } = useTranslation();
	const { libraryId } = Route.useParams();
	const gqlClient = useGraphQLClient();

	const { data, isLoading, error } = useQuery(
		libraryQuery(gqlClient, libraryId),
	);

	const library = data;
	const libraryCode = hostLmsCodeOf(data);

	if (isLoading)
		return (
			<Loading
				title={t("ui.info.loading.document", {
					document_type: t("libraries.library"),
				})}
				subtitle={t("ui.info.wait")}
			/>
		);

	if (error || !library)
		return (
			<ErrorComponent
				title={t("ui.error.cannot_retrieve_record")}
				action={t("ui.actions.go_back")}
				goBack="/libraries"
				message={t("ui.error.invalid_UUID")}
			/>
		);

	return (
		<PageContainer
			title={library.fullName}
			subtitle={t("insights.library.subtitle")}
		>
			<LibraryTabs libraryId={libraryId} value={9} />
			<Box sx={{ mt: 3 }}>
				{libraryCode ? (
					<InsightsDashboard libraryCode={libraryCode} />
				) : (
					<Typography color="text.secondary">
						{t("insights.library.no_hostlms")}
					</Typography>
				)}
			</Box>
		</PageContainer>
	);
}
