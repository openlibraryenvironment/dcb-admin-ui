import { useAuth } from "react-oidc-context";
import { createFileRoute } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import LoginIcon from "@mui/icons-material/Login";
import { z } from "zod";
import Loading from "@components/Loading/Loading";
import { useTranslation } from "react-i18next";

const Login = () => {
	const auth = useAuth();
	const { t } = useTranslation();

	// If user is already authenticated, redirect to home page
	// Retrieve the redirect path from the URL search parameters.
	const { redirect } = Route.useSearch();

	// If the user is already authenticated, redirect them to their intended page
	// or the dashboard. This handles cases where a logged-in user navigates to /login.
	// useEffect(() => {
	// 	// console.log(redirect);
	// 	console.log("Auth: ", auth);
	// 	if (auth.isAuthenticated) {
	// 		console.log(redirect);
	// 		navigate({ to: redirect || "/" });
	// 	}
	// }, [auth.isAuthenticated, navigate, redirect]);
	// Still need to handle this case but this should stop it causing problems.

	console.log("Current location is", window.location.pathname);
	console.log("Redirect is", redirect);
	const handleLogin = () => {
		// Store current location
		sessionStorage.setItem("postLoginRedirectPath", redirect || "/");
		const redirectPath = sessionStorage.getItem("postLoginRedirectPath");
		console.log("Final redirect is", redirectPath);
		// Trigger login redirect - this is being lost
		auth.signinRedirect();
	};

	if (auth.isLoading) {
		return (
			<Loading title={t("login.loading_title")} subtitle={t("ui.info.wait")} />
		);
	}

	return (
		<Box
			sx={{
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				minHeight: "100vh",
				backgroundColor: (theme) => theme.palette.grey[100],
			}}>
			<Paper
				elevation={3}
				sx={{
					p: 4,
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					maxWidth: 500,
					width: "100%",
				}}>
				<Typography component="h1" variant="h5" sx={{ mb: 3 }}>
					{t("login.title")}
				</Typography>

				<Typography variant="body1" sx={{ mb: 3, textAlign: "center" }}>
					{t("login.access")}
				</Typography>

				<Button
					fullWidth
					variant="contained"
					color="primary"
					onClick={handleLogin}
					disabled={auth.isLoading}
					startIcon={<LoginIcon />}
					sx={{ mt: 2 }}>
					{t("login.keycloak")}
				</Button>

				{auth.error && (
					<Typography color="error" sx={{ mt: 2 }}>
						Authentication error: {auth.error.message}
					</Typography>
				)}
			</Paper>
		</Box>
	);
};
export const Route = createFileRoute("/login")({
	validateSearch: z.object({
		redirect: z.string().optional().catch(""),
	}),
	component: Login,
});
