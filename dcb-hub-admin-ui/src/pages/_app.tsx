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

// We don't have to use Roboto - import whichever fonts you want here.
import { Roboto } from "next/font/google"
import Head from 'next/head';
import createEmotionCache from 'src/createEmotionCache';
import { useMediaQuery } from '@mui/material';

import { appWithTranslation } from 'next-i18next';
import { useMemo, useState } from 'react';


const clientSideEmotionCache = createEmotionCache();

export interface MyAppProps extends AppProps {
	emotionCache?: EmotionCache;
  }

  const roboto = Roboto({
	weight: ["300", "400", "500", "700"],
	style: ["normal", "italic"],
	subsets: ["latin"],
  });

function MyApp(props: MyAppProps) {
	const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;
	const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');	
	// set the theme here
	// For multi-theme, do as follows:
	// 1. Create either separate theme variables or theme.ts files.
	// 2. Apply changes accordingly within createTheme.
	// 3. Change the theme passed into the 'ThemeProvider' accordingly.
	const theme = useMemo(
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
			typography: {
				// and then set the fonts for the theme here
				fontFamily: roboto.style.fontFamily,
			}
		}),
		[prefersDarkMode],
	);

	const [queryClient] = useState(
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

export default appWithTranslation(MyApp);
