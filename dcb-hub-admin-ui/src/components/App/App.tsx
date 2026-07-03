import {
	Box,
	CircularProgress,
	CssBaseline,
	ThemeProvider,
	Typography,
} from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router, RouterProvider } from "@tanstack/react-router";
import { Suspense } from "react";
import { useAuth } from "react-oidc-context";
import { useTranslation } from "react-i18next";

import { getAppTheme } from "@themes/openRS";
import { useThemeStore } from "@hooks/useThemeStore";

interface AppProps {
	queryClient: QueryClient;
	router: Router<any, any>;
}
export default function App({ queryClient, router }: AppProps) {
	const auth = useAuth();
	const { t } = useTranslation();

	// The active brand theme + mode are user-selectable (see ThemeControls in
	// profile.tsx) and persisted; swap the whole theme rather than toggling a
	// colour scheme so all four+ theme/mode combinations apply cleanly.
	const themeName = useThemeStore((s) => s.themeName);
	const mode = useThemeStore((s) => s.mode);
	const theme = getAppTheme(themeName, mode);

	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider theme={theme}>
				<CssBaseline />
				<Suspense
					fallback={
						<Box
							sx={{
								display: "flex",
								height: "100vh",
								width: "100vw",
								alignItems: "center",
								justifyContent: "center",
								flexDirection: "column",
								gap: 2,
								backgroundColor: "primary.pageBackground",
							}}
						>
							<CircularProgress size={60} color="primary" />
							<Typography
								variant="loadingText"
								sx={{
									color: "primary.headingColor",
								}}
							>
								{t("common.loading")}
							</Typography>
						</Box>
					}
				>
					<RouterProvider router={router} context={{ auth }} />
				</Suspense>
			</ThemeProvider>
		</QueryClientProvider>
	);
}
