import {
	Box,
	CircularProgress,
	CssBaseline,
	Theme,
	ThemeProvider,
	Typography,
} from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router, RouterProvider } from "@tanstack/react-router";
import { Suspense } from "react";
import { useAuth } from "react-oidc-context";

interface AppProps {
	queryClient: QueryClient;
	theme: Theme;
	router: Router<any, any>;
}
export default function App({ queryClient, theme, router }: AppProps) {
	const auth = useAuth();

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
							<Typography variant="loadingText" color="primary.headingColor">
								Loading... {/** TODO */}
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
