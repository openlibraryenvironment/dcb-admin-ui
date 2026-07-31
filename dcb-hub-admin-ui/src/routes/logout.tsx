import { useEffect, useState } from "react";
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
} from "@mui/material";

import LoginLayout from "@layout/LoginLayout/LoginLayout";
import Link from "@components/Link/Link";
import Alert from "@components/Alert/Alert";
import LandingCard from "@components/LandingCard/LandingCard";
import { useConsortiumInfoStore } from "@hooks/consortiumInfoStore";
import {
	clearAppStorage,
	postLoginRedirectKey,
	toInternalPath,
} from "@helpers/appBase";

export const Route = createFileRoute("/logout")({
	// Validate if the user landed here via an intentional logout
	validateSearch: (search: Record<string, unknown>) => ({
		// Undefined rather than false when absent. Returning a literal `false`
		// stamped "?loggedOut=false" onto the URL of every session-expiry
		// redirect, which read as a claim that the user had NOT been logged out -
		// while they were staring at the logged-out page.
		loggedOut: search.loggedOut === "true" ? true : undefined,
		reason: search.reason as "session_expired" | "intentional" | undefined,
		// See login.tsx: this feeds the same post-login navigation, so it gets the
		// same constraint.
		redirect: toInternalPath(search.redirect as string | undefined),
	}),

	component: Logout,
});

function Logout() {
	const { t } = useTranslation();
	const auth = useAuth();
	// Atomic selector: destructuring the store subscribed this page to every
	// consortium field when it renders one of them.
	const displayName = useConsortiumInfoStore((s) => s.displayName);

	const { loggedOut, reason, redirect } = Route.useSearch();
	const sessionExpired = reason === "session_expired";
	// Both arrivals earn an explanation. Only the intentional-logout flag used to,
	// so a user whose session timed out was dropped on a bare login page with no
	// account of what had just happened to them.
	const [alertDisplayed, setAlertDisplayed] = useState(
		loggedOut === true || sessionExpired,
	);

	// Backstop for every route into this page. Each logout path purges before it
	// leaves, but signoutRedirect() is asynchronous - it revokes tokens over the
	// network before navigating - and any store that writes inside that window
	// puts its key straight back. This page is where all four paths land, and
	// nothing on it should be reading a signed-in user's state anyway.
	useEffect(() => {
		clearAppStorage();
	}, []);

	const handleSignIn = () => {
		// Mirrors login.tsx: main.tsx reads this back once OIDC completes. Without
		// it, an expired session sent the user home instead of to the page they
		// were on when it expired.
		if (redirect) {
			sessionStorage.setItem(postLoginRedirectKey(), redirect);
		}
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
						sx={{
							mb: 2,
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
										i18nKey={
											sessionExpired
												? "loginout.session_expired"
												: "loginout.logged_out"
										}
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
					<Stack
						direction="column"
						spacing={2}
						sx={{
							width: "fit-content",
						}}
					>
						<Typography
							variant="loginHeader"
							sx={{
								color: "primary.loginText",
							}}
						>
							{t("loginout.login")}
						</Typography>
						<Typography
							variant="subheading"
							sx={{
								color: "primary.loginText",
							}}
						>
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
