import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "react-oidc-context";
import { Stack, Typography } from "@mui/material";

import AdminLayout from "@layout/AdminLayout/AdminLayout";
import Loading from "@components/Loading/Loading";
import OperatingWelcome from "@components/OperatingWelcome/OperatingWelcome";

import { useConsortiumInfoStore } from "@hooks/consortiumInfoStore";

export const Route = createFileRoute("/__authenticated/")({
	component: Home,
});

function Home() {
	const auth = useAuth();
	const { t } = useTranslation();
	const { displayName } = useConsortiumInfoStore();

	// Check loading state natively through OIDC context
	if (auth.isLoading) {
		return (
			<AdminLayout>
				<Loading
					title={t("ui.info.loading.document", {
						document_type: t("nav.home").toLowerCase(),
					})}
					subtitle={t("ui.info.wait")}
				/>
			</AdminLayout>
		);
	}

	// Safely extract the user's name from the OIDC profile with robust fallbacks
	const profile = auth.user?.profile;
	const nameOfUser =
		profile?.given_name || profile?.name || t("app.guest_user");

	return (
		<AdminLayout
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
		</AdminLayout>
	);
}
