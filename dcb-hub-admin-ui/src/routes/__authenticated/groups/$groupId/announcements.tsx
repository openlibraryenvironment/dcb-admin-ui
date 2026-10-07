import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Grid } from "@mui/material";

import PageContainer from "@layout/PageContainer/PageContainer";
import GroupTabs from "@components/GroupTabs/GroupTabs";
import Loading from "@components/Loading/Loading";
import ErrorComponent from "@components/Error/Error";
import ScopeAnnouncements from "@components/ScopeAnnouncements/ScopeAnnouncements";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useIsConsortiumAdmin } from "@hooks/useIsConsortiumAdmin";
import { isAnnouncementsEnabled } from "@helpers/featureFlags";
import { getLibraryGroupById } from "@queries/getGroupById";
import { Group } from "@models/Group";
import { DETAIL_REFETCH_MS } from "@constants/refetchIntervals";
import type { LoadGroupQueryVariables } from "@generated/graphql";

/**
 * A group's announcements reach the patrons of every library in the group, so, like the
 * consortium's, only a consortium administrator may publish them.
 */
export const Route = createFileRoute(
	"/__authenticated/groups/$groupId/announcements",
)({
	beforeLoad: ({ context: { auth }, params }) => {
		if (!isAnnouncementsEnabled()) {
			throw redirect({ to: "/groups/$groupId", params });
		}

		// The roles may not have arrived on a cold load; the render guard below covers that
		if (!auth?.isAuthenticated) return;

		const roles = (auth.user?.profile?.roles as string[]) ?? [];
		if (!roles.includes("ADMIN") && !roles.includes("CONSORTIUM_ADMIN")) {
			throw redirect({ to: "/unauthorised" });
		}
	},
	component: GroupAnnouncements,
});

function GroupAnnouncements() {
	const { t } = useTranslation();
	const { groupId } = Route.useParams();
	const gqlClient = useGraphQLClient();
	const isConsortiumAdmin = useIsConsortiumAdmin();

	const { data, isLoading, error } = useQuery({
		queryKey: ["group", groupId],
		queryFn: () =>
			gqlClient.request<any, LoadGroupQueryVariables>(getLibraryGroupById, {
				query: `id:${groupId}`,
			}),
		refetchInterval: DETAIL_REFETCH_MS,
	});

	const group: Group | undefined = data?.libraryGroups?.content?.[0];

	if (!isConsortiumAdmin) {
		return (
			<PageContainer hideTitleBox hideBreadcrumbs>
				<ErrorComponent
					title={t("ui.error.401.name")}
					message={t("ui.error.401.summary")}
					description={t("ui.error.401.description")}
					action={t("ui.error.401.action")}
					goBack={`/groups/${groupId}`}
				/>
			</PageContainer>
		);
	}

	if (isLoading) {
		return (
			<PageContainer hideBreadcrumbs>
				<Loading title={t("groups.groups_one")} subtitle={t("ui.info.wait")} />
			</PageContainer>
		);
	}

	if (error || !group) {
		return (
			<PageContainer hideBreadcrumbs>
				<ErrorComponent
					title={t("ui.error.cannot_retrieve_record")}
					message={t("ui.info.connection_issue")}
					description={t("ui.info.try_later")}
					action={t("ui.actions.go_back")}
					goBack="/groups"
				/>
			</PageContainer>
		);
	}

	return (
		<PageContainer title={group.name}>
			<Grid
				container
				spacing={{ xs: 2, md: 3 }}
				columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
			>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<GroupTabs groupId={groupId} value={5} />
				</Grid>
			</Grid>
			<ScopeAnnouncements
				scopeType="LIBRARY_GROUP"
				scopeId={group.id}
				scopeHelp={t("groups.announcements.scope_help")}
				publishLabel={t("groups.announcements.publish")}
				confirmTitle={t("groups.announcements.confirm_title")}
				confirmBody={t("groups.announcements.confirm_body", {
					libraries: group.members?.length ?? 0,
					group: group.name,
				})}
			/>
		</PageContainer>
	);
}
