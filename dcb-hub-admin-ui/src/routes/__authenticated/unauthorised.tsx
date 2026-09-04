import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "react-oidc-context";
import { Alert, AlertTitle, Button, Stack, Typography } from "@mui/material";
import { OpenInNew } from "@mui/icons-material";

import PageContainer from "@layout/PageContainer/PageContainer";
import ErrorComponent from "@components/Error/Error";
import { capitaliseFirstCharacter } from "@helpers/capitaliseFirstCharacter";
import { belongsInLibrariesApp } from "@helpers/consortiumAccess";

export const Route = createFileRoute("/__authenticated/unauthorised")({
	component: Unauthorised,
});

/**
 * Where a refused account lands.
 *
 * <h2>Two different refusals, because they are two different problems</h2>
 *
 * DCB Admin is consortium-only. Most of the people who reach this page are not people
 * without permission - they are library staff who opened the wrong one of two applications
 * that look alike and share a sign-in. "You do not have access to this page, contact your
 * system administrator" is both unhelpful and slightly untrue for them: they DO have
 * access, to DCB Admin for Libraries, and their administrator has nothing to fix.
 *
 * So an account holding a library role and no consortium role is told where it should be,
 * and given a link when the deployment has been configured with one.
 *
 * <h2>Only when the account holds NOTHING else</h2>
 *
 * `belongsInLibrariesApp` is false the moment a consortium role appears. Consortium staff
 * are frequently administrators of their own library as well, and both roles ride on one
 * token - that is a supported arrangement, not a mistake, and those people are not barred
 * from here at all. They would only ever see this page by asking for something genuinely
 * beyond them, and being told to go somewhere else would be wrong twice over.
 *
 * Anyone else - no roles, a service role - gets the generic refusal, because there is no
 * other application to point them at and a guess would be worse than saying so plainly.
 */
function Unauthorised() {
	const { t } = useTranslation();
	const auth = useAuth();
	const router = useRouter();

	const roles = auth.user?.profile?.roles as string[] | undefined;
	const wrongApplication = belongsInLibrariesApp(roles);

	// Optional: a deployment that has not been told where its libraries app lives still
	// gets the explanation, just without the button. Naming the application is the part
	// that actually unsticks somebody; the link is a convenience.
	const librariesUrl = (
		router.options.context as {
			cfg?: { VITE_DCB_ADMIN_FOR_LIBRARIES_URL?: string };
		}
	)?.cfg?.VITE_DCB_ADMIN_FOR_LIBRARIES_URL;

	if (wrongApplication) {
		return (
			<PageContainer hideTitleBox={true} hideBreadcrumbs={true}>
				<Stack spacing={3} sx={{ maxWidth: 720 }}>
					<Typography variant="h1" component="h1">
						{t("loginout.wrong_app.title")}
					</Typography>

					<Alert severity="info">
						<AlertTitle>{t("loginout.wrong_app.summary")}</AlertTitle>
						{t("loginout.wrong_app.body")}
					</Alert>

					{librariesUrl ? (
						<Stack direction="row">
							{/* An external application on another origin, so a plain anchor
							    rather than a router link - and it says that it leaves. */}
							<Button
								variant="contained"
								href={librariesUrl}
								endIcon={<OpenInNew />}
							>
								{t("loginout.wrong_app.action")}
							</Button>
						</Stack>
					) : (
						<Typography variant="body2" sx={{ color: "text.secondary" }}>
							{t("loginout.wrong_app.no_link")}
						</Typography>
					)}
				</Stack>
			</PageContainer>
		);
	}

	return (
		<PageContainer hideTitleBox={true} hideBreadcrumbs={true}>
			<ErrorComponent
				title={t("ui.error.401.name")}
				message={t("ui.error.401.summary")}
				description={t("ui.error.401.description")}
				action={capitaliseFirstCharacter(t("ui.error.401.action"))}
				goBack="/"
			/>
		</PageContainer>
	);
}
