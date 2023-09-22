import * as React from 'react';
import '@styles/globals.scss';
import type { AppProps } from 'next/app';
// Next.js allows you to import CSS directly in .js files.
// It handles optimization and all the necessary Webpack configuration to make this work.

import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider, Hydrate } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ProgressBar } from '@components/ProgressBar';

import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { CacheProvider, EmotionCache } from "@emotion/react";

// We don't have to use Roboto - change font as needed here for MUI components
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import Head from 'next/head';
import createEmotionCache from 'src/createEmotionCache';
import { useMediaQuery } from '@mui/material';

// You change this configuration value to false so that the Font Awesome core SVG library
// will not try and insert <style> elements into the <head> of the page.
// Next.js blocks this from happening anyway so you might as well not even try.
// See https://fontawesome.com/v6/docs/web/use-with/react/use-with#next-js

const clientSideEmotionCache = createEmotionCache();

// Later, the theme work here can be spun out into its own file.
// We could then ship the relevant theme file for the relevant client.

export interface MyAppProps extends AppProps {
	emotionCache?: EmotionCache;
  }

function MyApp(props: MyAppProps) {
	const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;
	const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');	
	// set the theme here
	// For multi-theme, do as follows:
	// 1. Create either separate theme variables or theme.ts files.
	// 2. Apply changes accordingly within createTheme.
	// 3. Change the theme passed into the 'ThemeProvider' accordingly.
	const theme = React.useMemo(
		() =>
		// Uses the user's previously expressed system preference. If we want this to be toggleable, we'll need to change it 
		// accordingly.
		// We can also use setColorScheme to override the default 'dark' or 'light' as necessary.
		// For 'High Contrast' this should do the job
		// Eventually, we want a settings page for this where the user can select their 
		createTheme({
			palette: {
			contrastThreshold: 4.5,
			mode: prefersDarkMode ? 'dark' : 'light',
			background: {
				default: prefersDarkMode ? '#121212': '#fffff',
			},
			},
		}),
		[prefersDarkMode],
	);

	const [queryClient] = React.useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						refetchOnWindowFocus: false,
						refetchOnReconnect: false,
						retry: parseInt(process.env.NEXT_PUBLIC_API_MAX_RETRY ?? '5', 10)
					},
					mutations: {
						retry: parseInt(process.env.NEXT_PUBLIC_API_MAX_RETRY ?? '5', 10)
					}
				}
			})
	);

	return (
			<CacheProvider value={emotionCache}>
			<Head>
			<meta name="viewport" content="initial-scale=1, width=device-width" />
			</Head>
			<QueryClientProvider client={queryClient}>
			<Hydrate state={pageProps.dehydratedState}>
				<SessionProvider session={pageProps.session}>
					<ThemeProvider theme={theme}>
						<CssBaseline />
						<ProgressBar />
						<Component {...pageProps} />
						</ThemeProvider>
				</SessionProvider>
			</Hydrate>
			<ReactQueryDevtools initialIsOpen={false} />
		</QueryClientProvider>
		</CacheProvider>
	);
}

export default MyApp;
