import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "react-oidc-context";
import { Stack, Typography } from "@mui/material";

// Note: Using PageContainer instead of PageContainer!
import PageContainer from "@layout/PageContainer/PageContainer";
import OperatingWelcome from "@components/OperatingWelcome/OperatingWelcome";
import Error from "@components/Error/Error";
import { useConsortiumInfoStore } from "@hooks/consortiumInfoStore";

export const Route = createFileRoute("/__authenticated/")({
	// 1. THE LOADER: Pre-fetch data before the page renders.
	loader: async ({ context: { queryClient } }) => {
		// we might be able to pre-fetch operating welcome, but let's see

		return {};
	},

	// 2. THE ERROR BOUNDARY: error components go here instead
	errorComponent: ({ error }) => (
		<PageContainer hideTitleBox hideBreadcrumbs>
			<Error
				title="Unable to load the Dashboard"
				message={error.message}
				action="Reload Dashboard"
				reload={true}
			/>
		</PageContainer>
	),

	component: Home,
});

function Home() {
	const auth = useAuth();
	const { t } = useTranslation();
	const { displayName } = useConsortiumInfoStore();

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
