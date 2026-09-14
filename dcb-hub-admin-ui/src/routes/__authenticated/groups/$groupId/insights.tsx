import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Alert, Box } from "@mui/material";

import PageContainer from "@layout/PageContainer/PageContainer";
import GroupTabs from "@components/GroupTabs/GroupTabs";
import Loading from "@components/Loading/Loading";
import ErrorComponent from "@components/Error/Error";
import InsightsDashboard from "@components/Insights/InsightsDashboard";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { createGraphQLClient } from "@helpers/createGraphQLClient";
import { createRestClient } from "@helpers/createRestClient";
import { isInsightsEnabled } from "@helpers/featureFlags";
import { getLibraryGroupById } from "@queries/getGroupById";
import { groupParamsSchema } from "@schemas/routeParams/groupParams";
import { rangeToParams, intervalForRange } from "@helpers/insightsRange";
import { groupCodesOf, groupOf } from "@helpers/insightsGroupScope";

import { insightsSearchSchema } from "@helpers/insightsSearch";
import { useInsightsView } from "@hooks/useInsightsView";
import {
	dashboardQueryOptions,
	timeSeriesQueryOptions,
	StatsParams,
} from "@helpers/statsApi";
import type { LoadGroupQueryVariables } from "@generated/graphql";

// Must mirror insightsPlotStore's default preset so the prefetched keys match.
const DEFAULT_PRESET = "30d" as const;

// The same cache entry the group's other pages read, so arriving from the profile tab
// costs no round trip.
const groupQueryKey = (groupId: string) => ["group", groupId];

const fetchGroup = (
	client: ReturnType<typeof createGraphQLClient>,
	groupId: string,
) =>
	client.request<any, LoadGroupQueryVariables>(getLibraryGroupById, {
		query: `id:${groupId}`,
	});

export const Route = createFileRoute(
	"/__authenticated/groups/$groupId/insights",
)({
	params: {
		parse: (raw) => groupParamsSchema.parse(raw),
	},
	// The scope is fixed by the group in the path, but the window, the open subject,
	// the plotted series and the cost assumption are as shareable as anywhere else.
	validateSearch: insightsSearchSchema,
	// The tab is hidden while the flag is off, but the URL is still typeable - and the
	// page would call statistics endpoints this environment's dcb-service does not
	// serve yet.
	beforeLoad: ({ params: { groupId } }) => {
		if (!isInsightsEnabled()) {
			throw redirect({ to: "/groups/$groupId", params: { groupId } });
		}
	},
	loader: async ({
		context: { queryClient, cfg, auth },
		params: { groupId },
	}) => {
		if (!auth?.isAuthenticated) return;

		// The group first, because its members are what the statistics are scoped by.
		const data = await queryClient.ensureQueryData({
			queryKey: groupQueryKey(groupId),
			queryFn: () => fetchGroup(createGraphQLClient(cfg, auth), groupId),
		});

		const libraryCode = groupCodesOf(data);
		if (!libraryCode) return;

		const client = createRestClient(cfg, auth);
		const params: StatsParams = {
			libraryCode,
			...rangeToParams(DEFAULT_PRESET),
		};

		// Above-the-fold only: the combined KPI call plus the trend spine. Everything
		// else is a lazy panel.
		return Promise.all([
			queryClient.ensureQueryData(dashboardQueryOptions(client, params)),
			queryClient.ensureQueryData(
				timeSeriesQueryOptions(
					client,
					params,
					intervalForRange(DEFAULT_PRESET),
				),
			),
		]);
	},
	component: GroupInsights,
});

function GroupInsights() {
	const { t } = useTranslation();
	const { groupId } = Route.useParams();
	const view = useInsightsView(Route.useSearch(), "/groups/$groupId/insights");
	const gqlClient = useGraphQLClient();

	const { data, isLoading, error } = useQuery({
		queryKey: groupQueryKey(groupId),
		queryFn: () => fetchGroup(gqlClient, groupId),
	});

	const group = useMemo(() => groupOf(data), [data]);
	const libraryCode = useMemo(() => groupCodesOf(data), [data]);

	if (isLoading) {
		return (
			<Loading
				title={t("ui.info.loading.document", {
					document_type: t("groups.groups_one"),
				})}
				subtitle={t("ui.info.wait")}
			/>
		);
	}

	if (error || !group) {
		return (
			<ErrorComponent
				title={t("ui.error.cannot_retrieve_record")}
				action={t("ui.actions.go_back")}
				goBack="/groups"
				message={t("ui.error.invalid_UUID")}
			/>
		);
	}

	return (
		<PageContainer title={group.name} subtitle={t("insights.group.subtitle")}>
			<GroupTabs groupId={groupId} value={4} />
			<Box sx={{ mt: 3 }}>
				{libraryCode ? (
					<InsightsDashboard
						libraryCode={libraryCode}
						view={view}
						subjectBarTo="/groups/$groupId/insights"
						subjectBarParams={{ groupId }}
					/>
				) : (
					// A group whose members have no Host LMS between them has nothing to
					// filter the statistics by. Say so rather than rendering a page of
					// empty charts that reads as "this group did nothing".
					<Alert severity="info">{t("insights.group.no_codes")}</Alert>
				)}
			</Box>
		</PageContainer>
	);
}
