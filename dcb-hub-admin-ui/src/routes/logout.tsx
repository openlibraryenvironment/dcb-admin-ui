import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import LoginIcon from "@mui/icons-material/Login";
import { useAuth } from "react-oidc-context";
import { useGridStore } from "@/hooks/useDataGridStore";
import { z } from "zod";
import { useTranslation } from "react-i18next";

// Define the search params to handle the ?loggedOut=true flag
const logoutSearchSchema = z.object({
	loggedOut: z.boolean().optional().catch(false),
});

export const Route = createFileRoute("/logout")({
	validateSearch: logoutSearchSchema,
	component: Logout,
});

function Logout() {
	const auth = useAuth();
	const { clearGridState } = useGridStore();
	const { loggedOut } = Route.useSearch();
	const { t } = useTranslation();

	// Use a ref to ensure logout only triggers once per mount
	const hasTriggeredLogout = useRef(false);

	useEffect(() => {
		// If we are already in the "success" state, or auth is loading, do nothing.
		if (loggedOut || auth.isLoading || hasTriggeredLogout.current) {
			return;
		}

		const performLogout = async () => {
			hasTriggeredLogout.current = true;
			try {
				clearGridState();
				sessionStorage.removeItem("afterLoginRedirectPath");
				const postLogoutRedirectUri = `${window.location.origin}/logout?loggedOut=true`;
				await auth.signoutRedirect({
					post_logout_redirect_uri: postLogoutRedirectUri,
				});
			} catch (error) {
				console.error("Logout error:", error);
				hasTriggeredLogout.current = false;
			}
		};

		if (auth.isAuthenticated) {
			performLogout();
		} else if (!auth.isAuthenticated && !loggedOut) {
			// If user navigates to /logout manually but is already logged out,
			// just treat it as a success state to avoid infinite loops.
		}
	}, [auth, clearGridState, loggedOut]);

	if (loggedOut) {
		return (
			<Box
				sx={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					minHeight: "100vh",
					backgroundColor: (theme) => theme.palette.grey[100],
				}}
			>
				<Paper
					elevation={3}
					sx={{
						p: 4,
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						maxWidth: 400,
						width: "100%",
						textAlign: "center",
					}}
				>
					<CheckCircleOutlineIcon
						color="success"
						sx={{ fontSize: 60, mb: 2 }}
					/>

					<Typography component="h1" variant="h5" sx={{ mb: 2 }}>
						{t("ui.logout.out")}
					</Typography>

					<Typography variant="body1" sx={{ mb: 4 }}>
						{t("ui.logout.success")}
					</Typography>

					<Button
						component={Link}
						to="/login"
						variant="contained"
						color="primary"
						fullWidth
						startIcon={<LoginIcon />}
					>
						{t("ui.logout.again")}
					</Button>
				</Paper>
			</Box>
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
			}}
		>
			<Paper
				elevation={3}
				sx={{
					p: 4,
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					maxWidth: 400,
					width: "100%",
				}}
			>
				<Typography component="h1" variant="h5" sx={{ mb: 3 }}>
					{t("ui.logout.out_current")}
				</Typography>

				<CircularProgress sx={{ my: 2 }} />

				<Typography variant="body1" sx={{ textAlign: "center" }}>
					{t("ui.logout.out_progress")}
				</Typography>
			</Paper>
		</Box>
	);
}
