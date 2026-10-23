import { createFileRoute, redirect } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "react-oidc-context";
import { Stack, Typography } from "@mui/material";

// Note: Using PageContainer instead of PageContainer!
import PageContainer from "@layout/PageContainer/PageContainer";
import OperatingWelcome from "@components/OperatingWelcome/OperatingWelcome";
import ConsortiumSetupBanner from "@components/Setup/ConsortiumSetupBanner";
import Error from "@components/Error/Error";
import { useConsortiumInfoStore } from "@hooks/consortiumInfoStore";
import { validateGridSearch } from "@helpers/viewState/gridSearch";
import {
	defaultQueryModels,
	rememberedViewRedirect,
} from "@helpers/viewState/viewRoute";
import { welcomeLibrariesView } from "@constants/dataGrid/gridViews";
import { welcomeLibrariesQuery } from "@/queryOptions/welcomeLibraries";
import { createGraphQLClient } from "@helpers/createGraphQLClient";
import i18n from "@/i18n";

export const Route = createFileRoute("/__authenticated/")({
	// The welcome grid's view, which is this page's main parameters
	validateSearch: validateGridSearch,
	loaderDeps: ({ search }) => search,
	beforeLoad: ({ search, location }) => {
		const restore = rememberedViewRedirect(
			welcomeLibrariesView,
			search,
			location.state,
		);
		if (restore) throw redirect({ to: "/", ...restore });
	},
	// Pre-fetch the welcome grid's first page before render
	loader: ({ context: { queryClient, cfg, auth }, deps, location, cause }) => {
		// Skip prefetching for unauthenticated visitors - the request would
		// fail (no token) and its failure would trigger the global network/401
		// handler in main.tsx before __authenticated.tsx's own auth-gate
		// redirect to /login ever runs.
		if (!auth?.isAuthenticated) return;
		// The reader paging or sorting: the grid is already fetching it
		if (cause === "stay") return;
		const models = defaultQueryModels(
			welcomeLibrariesView,
			deps,
			location.state,
		);
		if (!models) return;
		return queryClient.ensureQueryData(
			welcomeLibrariesQuery(createGraphQLClient(cfg, auth), models),
		);
	},

	errorComponent: ({ error }) => (
		<PageContainer hideTitleBox hideBreadcrumbs>
			<Error
				title={i18n.t("ui.error.unable_to_load_page")}
				message={error.message}
				action={i18n.t("ui.actions.reload")}
				onAction={() => location.reload()}
			/>
		</PageContainer>
	),

	component: Home,
});

function Home() {
	const auth = useAuth();
	const { t } = useTranslation();
	const displayName = useConsortiumInfoStore((state) => state.displayName);

	const profile = auth.user?.profile;
	const nameOfUser =
		profile?.given_name || profile?.name || t("app.guest_user");

	return (
		<PageContainer
			title={t("welcome.greeting", { user: nameOfUser })}
			hideTitleBox={true}
		>
			<Stack direction="column" spacing={2} sx={{ mt: 2 }}>
				<Typography variant="h1">
					{t("welcome.greeting", { user: nameOfUser })}
				</Typography>

				{/* Above the fold and above the grid: on an instance with nothing set up,
				    the grid below is empty and says nothing about why. Renders nothing at
				    all once setup is finished - see the component. */}
				<ConsortiumSetupBanner />

				<Typography variant="homePageText">
					{t("welcome.context", {
						consortium_name: displayName || t("consortium.name"),
					})}
				</Typography>

				<Typography variant="h2" sx={{ mt: 4 }}>
					{t("consortium.your")}
				</Typography>

				<OperatingWelcome />
			</Stack>
		</PageContainer>
	);
}
