import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation, Trans } from "react-i18next";
import { useAuth } from "react-oidc-context";
import {
	Alert,
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
import {
	assertOidcAuthorityReachable,
	isOidcAuthorityUnavailableError,
	oidcDiscoveryUrl,
} from "@helpers/oidcPreflight";

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
	const { cfg } = Route.useRouteContext();
	const authority = cfg?.VITE_KEYCLOAK_URL as string | undefined;
	const [loginError, setLoginError] = useState<{
		discoveryUrl: string;
		message: string;
	} | null>(null);

	// Grab the redirect URL passed from __authenticated.tsx
	const { redirect } = Route.useSearch();

	const handleSignIn = async () => {
		setLoginError(null);

		try {
			await assertOidcAuthorityReachable(authority);

			// Store the redirect path so main.tsx can route them back after OIDC completes
			if (redirect) {
				sessionStorage.setItem("postLoginRedirectPath", redirect);
			}
			// Trigger react-oidc-context sign-in flow
			await auth.signinRedirect();
		} catch (error) {
			const discoveryUrl =
				isOidcAuthorityUnavailableError(error) && error.discoveryUrl
					? error.discoveryUrl
					: authority
						? oidcDiscoveryUrl(authority)
						: "";

			setLoginError({
				discoveryUrl,
				message: error instanceof Error ? error.message : String(error),
			});
		}
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
						{loginError ? (
							<Alert
								severity="warning"
								sx={{ mb: 2 }}
								action={
									loginError.discoveryUrl ? (
										<Button
											color="inherit"
											component="a"
											href={loginError.discoveryUrl}
											rel="noreferrer"
											size="small"
											target="_blank"
										>
											{t("loginout.open_identity_provider")}
										</Button>
									) : undefined
								}
							>
								<Typography variant="body2" sx={{ fontWeight: 600 }}>
									{t("loginout.identity_provider_unreachable")}
								</Typography>
								<Typography variant="body2">
									{t("loginout.identity_provider_unreachable_detail", {
										error: loginError.message,
									})}
								</Typography>
								<Typography variant="body2" sx={{ mt: 1 }}>
									{t("loginout.local_https_trust_hint")}
								</Typography>
							</Alert>
						) : null}
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
