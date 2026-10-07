import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import PageContainer from "@layout/PageContainer/PageContainer";
import ConsortiumTabs from "@components/ConsortiumTabs/ConsortiumTabs";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { consortiumBasicsQuery } from "@/queryOptions/consortium";
import { libraryCountQuery } from "@/queryOptions/setup";
import { isAnnouncementsEnabled } from "@helpers/featureFlags";
import { useIsConsortiumAdmin } from "@hooks/useIsConsortiumAdmin";
import ErrorComponent from "@components/Error/Error";
import ScopeAnnouncements from "@components/ScopeAnnouncements/ScopeAnnouncements";

/**
 * A consortium announcement reaches every patron of every member library. The confirmation
 * counts member LIBRARIES, not patrons: DCB holds no patron roster.
 */
export const Route = createFileRoute(
	"/__authenticated/consortium/announcements",
)({
	// The tab is hidden while the flag is off, but the URL is still typeable — and every
	// operation on this page is one dcb-service declares on no release, so each would be a
	// validation error that fails the whole request.
	beforeLoad: ({ context: { auth } }) => {
		if (!isAnnouncementsEnabled()) {
			throw redirect({ to: "/consortium" });
		}

		// MUST come after the flag check and before the roles: react-oidc-context
		// restores the session asynchronously, so on a cold load beforeLoad runs before
		// the roles exist. The render guard below is the half that covers that path.
		if (!auth?.isAuthenticated) return;

		// dcb-service refuses consortium scope to anyone but a CONSORTIUM_ADMIN, so
		// without this a library administrator gets the form and a publish that can only
		// be refused.
		const roles = (auth.user?.profile?.roles as string[]) ?? [];
		if (!roles.includes("ADMIN") && !roles.includes("CONSORTIUM_ADMIN")) {
			throw redirect({ to: "/unauthorised" });
		}
	},
	component: ConsortiumAnnouncementsPage,
});

function ConsortiumAnnouncementsPage() {
	const { t } = useTranslation();
	const client = useGraphQLClient();
	const isConsortiumAdmin = useIsConsortiumAdmin();

	const basics = useQuery(consortiumBasicsQuery(client));
	const scopeId = basics.data?.consortia?.content?.[0]?.id as
		string | undefined;

	// The member-library count, from the query that already exists for it: the consortium's
	// libraryGroup association is not joined and returns null
	const libraryCount = useQuery(libraryCountQuery(client));

	// The second half of the guard, for the cold load beforeLoad cannot see - the roles
	// are not there yet when it runs. The form is never rendered.
	if (!isConsortiumAdmin) {
		return (
			<PageContainer hideTitleBox hideBreadcrumbs>
				<ErrorComponent
					title={t("ui.error.401.name")}
					message={t("ui.error.401.summary")}
					description={t("ui.error.401.description")}
					action={t("ui.error.401.action")}
					goBack="/consortium"
				/>
			</PageContainer>
		);
	}

	return (
		<PageContainer title={t("nav.consortium.announcements")}>
			<ConsortiumTabs current="announcements" />
			<ScopeAnnouncements
				scopeType="CONSORTIUM"
				scopeId={scopeId}
				scopeHelp={t("consortium.announcements.scope_help")}
				publishLabel={t("consortium.announcements.publish")}
				confirmTitle={t("consortium.announcements.confirm_title")}
				confirmBody={t("consortium.announcements.confirm_body", {
					libraries: libraryCount.data ?? "?",
				})}
			/>
		</PageContainer>
	);
}
