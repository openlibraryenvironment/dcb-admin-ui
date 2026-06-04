import { CssBaseline, Theme, ThemeProvider } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router, RouterProvider } from "@tanstack/react-router";
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
				<RouterProvider router={router} context={{ auth }} />
			</ThemeProvider>
		</QueryClientProvider>
	);
}
