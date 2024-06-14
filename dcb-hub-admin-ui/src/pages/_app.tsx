import "@styles/globals.scss";
// Next.js allows you to import CSS directly in .js files.
// It handles optimization and all the necessary Webpack configuration to make this work.
// This is what makes our MUI Pro licence key work.
import { LicenseInfo } from "@mui/x-license";
import { SessionProvider } from "next-auth/react";
import { ProgressBar } from "@components/ProgressBar";
import { ApolloProviderWrapper } from "@components/ApolloProviderWrapper/ApolloProviderWrapper";

import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { AppCacheProvider } from "@mui/material-nextjs/v13-pagesRouter";

// We don't have to use Roboto - import whichever fonts you want here.
import Head from "next/head";
import { AppProps } from "next/app";
import { useMediaQuery } from "@mui/material";

import { appWithTranslation } from "next-i18next";
import { openRSLight, openRSDark } from "src/themes/openRS";
declare module "@mui/material/styles" {
	interface PaletteColor {
		breadcrumbs?: string;
		buttonForSelectedChildPage?: string;
		buttonForSelectedPage?: string;
		detailsAccordionSummary?: string;
		exclamationIcon?: string;
		footerArea?: string;
		footerText?: string;
		foreground1?: string;
		header?: string;
		headerText?: string;
		hover?: string;
		hoverOnSelectedPage?: string;
		link?: string;
		linkText?: string;
		landingBackground?: string;
		landingCard?: string;
		loginCard?: string;
		loginText?: string;
		selectedText?: string;
		sidebar?: string;
		titleArea?: string;
		linkedFooterBackground?: string;
		linkedFooterText?: string;
		pageBackground?: string;
		pageContentBackground?: string;
	}

	interface SimplePaletteColorOptions {
		breadcrumbs?: string;
		buttonForSelectedChildPage?: string;
		buttonForSelectedPage?: string;
		detailsAccordionSummary?: string;
		exclamationIcon?: string;
		footerArea?: string;
		footerText?: string;
		foreground1?: string;
		header?: string;
		headerText?: string;
		hover?: string;
		hoverOnSelectedPage?: string;
		link?: string;
		linkText?: string;
		landingBackground?: string;
		landingCard?: string;
		loginCard?: string;
		loginText?: string;
		selectedText?: string;
		sidebar?: string;
		titleArea?: string;
		linkedFooterBackground?: string;
		linkedFooterText?: string;
		pageBackground?: string;
		pageContentBackground?: string;
	}
	interface TypographyVariants {
		appTitle?: React.CSSProperties;
		loginCardText?: React.CSSProperties;
		subheading?: React.CSSProperties;
		cardActionText?: React.CSSProperties;
		attributeTitle?: React.CSSProperties;
		loginHeader?: React.CSSProperties;
		modalTitle?: React.CSSProperties;
		homePageText?: React.CSSProperties;
		notFoundTitle?: React.CSSProperties;
		notFoundText?: React.CSSProperties;
		componentSubheading?: React.CSSProperties;
		linkedFooterTextSize?: React.CSSProperties;
		linkedFooterHeader?: React.CSSProperties;
		loadingText?: React.CSSProperties;
	}
	interface TypographyVariantsOptions {
		appTitle?: React.CSSProperties;
		loginCardText?: React.CSSProperties;
		subheading?: React.CSSProperties;
		cardActionText?: React.CSSProperties;
		attributeTitle?: React.CSSProperties;
		attributeText?: React.CSSProperties;
		loginHeader?: React.CSSProperties;
		modalTitle?: React.CSSProperties;
		homePageText?: React.CSSProperties;
		notFoundTitle?: React.CSSProperties;
		notFoundText?: React.CSSProperties;
		componentSubheading?: React.CSSProperties;
		linkedFooterTextSize?: React.CSSProperties;
		linkedFooterHeader?: React.CSSProperties;
		loadingText?: React.CSSProperties;
	}
}
declare module "@mui/material/Typography" {
	interface TypographyPropsVariantOverrides {
		appTitle: true;
		loginCardText: true;
		subheading: true;
		cardActionText: true;
		attributeTitle: true;
		attributeText: true;
		loginHeader: true;
		modalTitle: true;
		homePageText: true;
		notFoundTitle: true;
		notFoundText: true;
		componentSubheading: true;
		linkedFooterTextSize: true;
		linkedFooterHeader: true;
		loadingText: true;
	}
}

declare module "@mui/material/Button" {
	interface ButtonPropsSizeOverrides {
		xlarge: true;
	}
}

// const clientSideEmotionCache = createEmotionCache();

LicenseInfo.setLicenseKey(String(process.env.NEXT_PUBLIC_MUI_X_LICENSE_KEY));

function MyApp(props: AppProps) {
	const { Component, pageProps } = props;
	const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

	// set the theme here
	// For multi-theme, do as follows:
	// 1. Create either separate theme variables or theme.ts files.
	// 2. Apply changes accordingly within createTheme.
	// 3. Change the theme passed into the 'ThemeProvider' accordingly.
	// Provide different theme objects and conditionally supply them to ThemeProvider
	// 'Dark' and 'light' should be considered as modes that affect a given theme, not themes themselves.
	// Themes will now have light and dark variants to support these modes due to the move into putting themes in separate files.

	// This line defines the currently set theme for DCB Admin.
	// You should provide both light and dark variants of your theme to fully support light / dark mode for the user.
	const theme = prefersDarkMode ? openRSDark : openRSLight;

	return (
		<AppCacheProvider {...props}>
			<Head>
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<title> DCB Admin </title>
			</Head>
			<SessionProvider
				session={pageProps.session}
				refetchOnWindowFocus={true}
				refetchWhenOffline={false}
				refetchInterval={3.75 * 60} // This is how often we check the session. Maximum interval is probably 29 mins (just under maxAge)
				// Checking just under every 4 mins to try and fix the issues we've been seeing + provide up-to-date session info.
				// Was previously exactly 4 but that can interfere with the refreshes.
			>
				<ApolloProviderWrapper>
					<ThemeProvider theme={theme}>
						<CssBaseline />
						<ProgressBar />
						<Component {...pageProps} />
					</ThemeProvider>
				</ApolloProviderWrapper>
			</SessionProvider>
		</AppCacheProvider>
	);
}

export default appWithTranslation(MyApp);
