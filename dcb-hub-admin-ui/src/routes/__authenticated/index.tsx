import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "react-oidc-context";
import { Stack, Typography } from "@mui/material";

// Note: Using PageContainer instead of PageContainer!
import PageContainer from "@layout/PageContainer/PageContainer";
import OperatingWelcome from "@components/OperatingWelcome/OperatingWelcome";
import Error from "@components/Error/Error";
import { useConsortiumInfoStore } from "@hooks/consortiumInfoStore";
import { getLibraries } from "@queries/getLibraries";
import { createGraphQLClient } from "@helpers/createGraphQLClient";
import i18n from "@/i18n";
import type { LoadLibrariesQueryVariables } from "@generated/graphql";

// Default-state prefetch: mirrors OperatingWelcome's own useGridState defaults
// (pageSize 200, sort fullName ASC, no filter) AND its literal "LoadLibraries"
// query key, so the cache entry lines up on a fresh render and the welcome
// grid paints with its rows/count already populated instead of flashing.
const DEFAULT_PAGINATION_MODEL = { page: 0, pageSize: 200 };
const DEFAULT_SORT_MODEL = [{ field: "fullName", sort: "asc" }];
const DEFAULT_FILTER_MODEL = { items: [] };

export const Route = createFileRoute("/__authenticated/")({
	// 1. THE LOADER: Pre-fetch the welcome grid's first page before render.
	loader: ({ context: { queryClient, cfg, auth } }) => {
		// Skip prefetching for unauthenticated visitors - the request would
		// fail (no token) and its failure would trigger the global network/401
		// handler in main.tsx before __authenticated.tsx's own auth-gate
		// redirect to /login ever runs.
		if (!auth?.isAuthenticated) return;
		return queryClient.ensureQueryData({
			queryKey: [
				"LoadLibraries",
				DEFAULT_PAGINATION_MODEL,
				DEFAULT_SORT_MODEL,
				DEFAULT_FILTER_MODEL,
			],
			queryFn: () =>
				createGraphQLClient(cfg, auth).request<
					any,
					LoadLibrariesQueryVariables
				>(getLibraries, {
					query: "",
					pageno: DEFAULT_PAGINATION_MODEL.page,
					pagesize: DEFAULT_PAGINATION_MODEL.pageSize,
					order: DEFAULT_SORT_MODEL[0].field,
					orderBy: "ASC",
				}),
		});
	},

	errorComponent: ({ error }) => (
		<PageContainer hideTitleBox hideBreadcrumbs>
			<Error
				title={i18n.t("ui.error.unable_to_load_page")}
				message={error.message}
				action={i18n.t("ui.actions.reload")}
				reload={true}
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
