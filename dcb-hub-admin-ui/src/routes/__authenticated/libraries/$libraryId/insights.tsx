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
import { getLibrary } from "@queries/getLibrary";
import { libraryParamsSchema } from "@schemas/routeParams/libraryParams";
import { rangeToParams, intervalForRange } from "@helpers/insightsRange";
import {
	dashboardQueryOptions,
	timeSeriesQueryOptions,
	StatsParams,
} from "@helpers/statsApi";
import type { LoadLibraryQueryVariables } from "@generated/graphql";

// Must mirror insightsPlotStore's default preset so the prefetched keys match.
const DEFAULT_PRESET = "30d" as const;

// The stats endpoints filter on a Host LMS code (patron_hostlms_code), which for a
// library is Library.agency.hostLms.code - resolved from the library record here.
function hostLmsCodeOf(libraryData: any): string | undefined {
	return libraryData?.libraries?.content?.[0]?.agency?.hostLms?.code;
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
		const libraryData = await queryClient.ensureQueryData({
			queryKey: ["library", libraryId],
			queryFn: () =>
				createGraphQLClient(cfg, auth).request<any, LoadLibraryQueryVariables>(
					getLibrary,
					{
						query: `id:${libraryId}`,
					},
				),
		});

		const libraryCode = hostLmsCodeOf(libraryData);
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

	const { data, isLoading, error } = useQuery({
		queryKey: ["library", libraryId],
		queryFn: () =>
			gqlClient.request<any, LoadLibraryQueryVariables>(getLibrary, {
				query: `id:${libraryId}`,
			}),
		enabled: !!libraryId,
	});

	const library = data?.libraries?.content?.[0];
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
