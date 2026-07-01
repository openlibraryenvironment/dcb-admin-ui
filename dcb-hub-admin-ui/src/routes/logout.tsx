import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation, Trans } from "react-i18next";
import { useAuth } from "react-oidc-context";
import {
	Box,
	Button,
	Card,
	CardContent,
	Stack,
	Typography,
	useTheme,
} from "@mui/material";

import LoginLayout from "@layout/LoginLayout/LoginLayout";
import Link from "@components/Link/Link";
import Alert from "@components/Alert/Alert";
import LandingCard from "@components/LandingCard/LandingCard";
import { useConsortiumInfoStore } from "@hooks/consortiumInfoStore";

export const Route = createFileRoute("/logout")({
	// Validate if the user landed here via an intentional logout
	validateSearch: (search: Record<string, unknown>) => ({
		loggedOut: search.loggedOut === "true",
		reason: search.reason as "session_expired" | "intentional" | undefined,
		redirect: search.redirect as string | undefined,
	}),

	component: Logout,
});

function Logout() {
	const theme = useTheme();
	const { t } = useTranslation();
	const auth = useAuth();
	const { displayName } = useConsortiumInfoStore();

	const { reason, redirect, loggedOut } = Route.useSearch();
	const [alertDisplayed, setAlertDisplayed] = useState(loggedOut);

	const handleSignIn = () => {
		auth.signinRedirect();
	};

	return (
		<LoginLayout pageName="logOut">
			<Card
				variant="outlined"
				sx={{
					backgroundColor: "primary.loginCard",
					pt: 4,
					pb: 4,
					border: "none",
					width: "100%",
				}}
			>
				{alertDisplayed && (
					<Box
						mb={2}
						sx={{
							maxWidth: "1400px",
							margin: "auto",
							paddingLeft: "16px",
							paddingRight: "16px",
						}}
					>
						<Alert
							severityType="info"
							onCloseFunc={() => setAlertDisplayed(false)}
							titleShown={false}
							alertText={
								<Typography variant="loginCardText">
									<Trans
										i18nKey="loginout.logged_out"
										t={t}
										components={{ bold: <strong />, break: <br /> }}
										values={{ appName: "DCB Admin", consortium: displayName }}
									/>
								</Typography>
							}
						/>
					</Box>
				)}
				<CardContent sx={{ maxWidth: "1400px", margin: "auto" }}>
					<Stack direction="column" spacing={2} width="fit-content">
						<Typography color="primary.loginText" variant="loginHeader">
							{t("loginout.login")}
						</Typography>
						<Typography color="primary.loginText" variant="subheading">
							<Trans
								i18nKey="loginout.keycloak"
								t={t}
								components={{
									linkComponent: (
										<Link
											key="keycloak-link"
											href="https://openlibraryfoundation.atlassian.net/wiki/spaces/DCB/pages/2817064969/"
										/>
									),
								}}
							/>
						</Typography>
					</Stack>
					<Box sx={{ mt: 3.5 }}>
						<Button
							variant="contained"
							color="primary"
							size="xlarge"
							onClick={handleSignIn}
						>
							{t("nav.login")}
						</Button>
					</Box>
				</CardContent>
			</Card>

			<Box sx={{ width: "100%", maxWidth: "1400px", margin: "auto" }}>
				<LandingCard />
			</Box>
		</LoginLayout>
	);
}
