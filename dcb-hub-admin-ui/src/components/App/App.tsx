import {
	Box,
	CircularProgress,
	CssBaseline,
	ThemeProvider,
	Typography,
} from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router, RouterProvider } from "@tanstack/react-router";
import { Suspense, useMemo } from "react";
import { useAuth } from "react-oidc-context";
import { useTranslation } from "react-i18next";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import { getAppTheme } from "@themes/openRS";
import { useThemeStore } from "@hooks/useThemeStore";
import { useMotionPreference } from "@hooks/useMotionPreference";
import { useResolvedMode } from "@hooks/useResolvedMode";
import { useLocaleStore } from "@hooks/useLocaleStore";
import {
	DAYJS_LOCALES,
	deploymentLocale,
	resolveFormatLocale,
} from "@helpers/locale";

interface AppProps {
	queryClient: QueryClient;
	router: Router<any, any>;
}
export default function App({ queryClient, router }: AppProps) {
	const auth = useAuth();
	const { t } = useTranslation();

	// The brand theme, mode, typeface, text size and density are user-selectable
	// (ThemeControls, reachable from /settings, /profile and the setup flow) and
	// persisted; swap the whole theme rather than toggling a colour scheme so all
	// combinations apply cleanly.
	//
	// Atomic selectors, and a memo over them: getAppTheme already caches, but reading the
	// store as one object would hand ThemeProvider a new value on every unrelated store
	// write.
	//
	// `mode` comes from useResolvedMode rather than straight from the store, because the
	// store holds null for "follow my device" and that hook is the only thing that turns
	// it into a mode - watching prefers-contrast and prefers-color-scheme, in that order
	// of precedence, and subscribing to both rather than reading them once.
	const themeName = useThemeStore((s) => s.themeName);
	const fontName = useThemeStore((s) => s.fontName);
	const textSize = useThemeStore((s) => s.textSize);
	const density = useThemeStore((s) => s.density);
	const mode = useResolvedMode();

	// Motion is CSS on <html>, not a theme value; see the hook for why.
	useMotionPreference();

	const theme = useMemo(
		() => getAppTheme(themeName, mode, fontName, { textSize, density }),
		[themeName, mode, fontName, textSize, density],
	);

	// One provider for every date picker, so the grid's filters, the Insights range and
	// any picker added later all read the same date order and first weekday.
	const languageChoice = useLocaleStore((s) => s.choice);
	const adapterLocale =
		DAYJS_LOCALES[resolveFormatLocale(languageChoice, deploymentLocale())];

	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider theme={theme}>
				<LocalizationProvider
					dateAdapter={AdapterDayjs}
					adapterLocale={adapterLocale}
				>
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
				</LocalizationProvider>
			</ThemeProvider>
		</QueryClientProvider>
	);
}
