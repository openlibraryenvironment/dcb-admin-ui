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
import LandingCard from "@components/LandingCard/LandingCard";

export const Route = createFileRoute("/login")({
	// TanStack Router: Type-safe search params validation
	validateSearch: (search: Record<string, unknown>) => ({
		redirect: search.redirect as string | undefined,
	}),
	component: Login,
});

function Login() {
	const { t } = useTranslation();
	const auth = useAuth();

	// Grab the redirect URL passed from __authenticated.tsx
	const { redirect } = Route.useSearch();

	const handleSignIn = () => {
		// Store the redirect path so main.tsx can route them back after OIDC completes
		if (redirect) {
			sessionStorage.setItem("postLoginRedirectPath", redirect);
		}
		// Trigger react-oidc-context sign-in flow
		auth.signinRedirect();
	};

	return (
		<LoginLayout pageName="landingPage">
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
											key="keycloak-information-link"
											href="https://openlibraryfoundation.atlassian.net/wiki/spaces/DCB/pages/2817064969/"
										/>
									),
								}}
							/>
						</Typography>
					</Stack>
					<Box sx={{ mt: 3.5 }}>
						<Button
							data-tid="login-button"
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
