import '@styles/globals.scss';
import type { AppProps } from 'next/app';
// Next.js allows you to import CSS directly in .js files.
// It handles optimization and all the necessary Webpack configuration to make this work.

import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider, Hydrate } from '@tanstack/react-query';
import { ProgressBar } from '@components/ProgressBar';
import { ApolloProviderWrapper } from '@components/ApolloProviderWrapper/ApolloProviderWrapper'


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
declare module '@mui/material/styles' {
	interface PaletteColor {
	  foreground1?: string;
	  linkText?: string;
	  selected?: string;
	  sidebar?: string;
	  titleArea?: string;
	  link?: string;
	  header?: string;
	  headerText?: string;
	  footerArea?: string;
	  breadcrumbs?: string;
	}
  
	interface SimplePaletteColorOptions {
	  foreground1?: string;
	  linkText?: string;
	  selected?: string;
	  sidebar?: string;
	  titleArea?: string;
	  link?: string;
	  header?: string;
	  headerText?: string;
	  footerArea?: string;
	  breadcrumbs?: string;	}
  }

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
	// Provide different theme objects and conditionally supply them to ThemeProvider
	// We may want to put these themes into a 'theme.ts' file.
	// 'Dark' and 'light' should be considered as modes that affect a given theme, not themes themselves.

	// The original default theme.
	const defaultTheme = useMemo(
		() =>
		// Uses the user's previously expressed system preference. If we want this to be toggleable, we'll need to change it 
		// accordingly.
		// We can also use setColorScheme to override the default 'dark' or 'light' as necessary.
		// For 'High Contrast' this should do the job
		// Eventually, we want a settings page for this where the user can select their choice.
		createTheme({
			palette: {
				contrastThreshold: 4.5,
				mode: prefersDarkMode ? 'dark' : 'light',
				background: {
					default: prefersDarkMode ? '#121212': '#fffff',
				},
			},
			typography: {
				h1: {
					fontSize: 20
				},
				h2: {
					fontSize: 32
				},
				h3: {
					fontSize: 20
				},
				h4: {
					fontSize: 18
				},
				// and then set the fonts for the theme here
				fontFamily: roboto.style.fontFamily,
			}
		}),
		[prefersDarkMode],
	);
	// A greyscale theme, initially for testing purposes only.
	const greyscale = useMemo(
		() =>
		createTheme({
			palette: {
				contrastThreshold: 4.5,
				mode: prefersDarkMode ? 'dark' : 'light',
				primary: {
					main: "#999999",
					foreground1: "#eeeeee",
					linkText: "#085394",
					selected: prefersDarkMode? "424242": "#eeeeee",
					sidebar: prefersDarkMode? "#121212": "#dddddd",
					header: "#424242",
					headerText: "#ffffff",					
					titleArea: prefersDarkMode? "#424242": "#ffffff",
					footerArea: "#424242",
					link: "#B3E5FC",
					breadcrumbs: "#0d47a1"
				}, 
				background: {
					default: prefersDarkMode? '#121212': "#eeeeee"
				}
			},
			// If you're wondering how this is done, see https://mui.com/material-ui/customization/theme-components/ and https://mui.com/material-ui/customization/palette/
			components: {
				// Component variants can also be created here https://mui.com/material-ui/customization/theme-components/#creating-new-component-variants 
				MuiCard: {
					// You can also use defaultProps here to do things like turning animations off.
					styleOverrides: {
						// The name of the slot - usually just root.
						root: {
							// CSS goes here.
							backgroundColor: prefersDarkMode? "#121212": "#eeeeee",
						},
					  },
				},
				MuiPaper: {
					styleOverrides: {
						root: {
						  backgroundColor: prefersDarkMode? '#121212': "#eeeeee",
						},
					},
				},
				MuiCardContent: {
					styleOverrides: {
						root: {
						  backgroundColor: prefersDarkMode? '#121212': "#eeeeee",
						},
					},
				},
				MuiButton: {
					styleOverrides: {
						root: ({ ownerState }) => ({
							...(ownerState.variant === 'text' &&
							  ownerState.color === 'primary' && {
								color: '#121212',
							  }),
						}),
					},
				}
			},
			typography: {
				h1: {
					fontSize: 20
				},
				h2: {
					fontSize: 32
				},
				h3: {
					fontSize: 20
				},
				h4: {
					fontSize: 18
				},
				// and then set the fonts for the theme here
				fontFamily: roboto.style.fontFamily,
			}
		}),
		[prefersDarkMode],
	);

	// const [themeSelected, setThemeSelected] = useState(theme);
	// For some reason, this does not work very well with dark mode. Does the object get truncated?
	// To be investigated when manual theme selection is needed. It may be that a more complex state object is needed.

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

	// Work to fully remove react-query and complete switch to Apollo will be done when server-side pagination is implemented across the app.
	// https://openlibraryfoundation.atlassian.net/browse/DCB-480 
	return (
			<CacheProvider value={emotionCache}>
			<Head>
			<meta name="viewport" content="width=device-width, initial-scale=1" />
			<title> DCB Admin </title>
			</Head>
			<SessionProvider session={pageProps.session}>
			<ApolloProviderWrapper>
			<QueryClientProvider client={queryClient}>
			<Hydrate state={pageProps.dehydratedState}>
					<ThemeProvider theme={greyscale}>
						<CssBaseline />
						<ProgressBar />
						<Component {...pageProps} />
						</ThemeProvider>
			</Hydrate>
			{/* <ReactQueryDevtools initialIsOpen={false} /> */}
		</QueryClientProvider>
		</ApolloProviderWrapper>
		</SessionProvider>
		</CacheProvider>
	);
}

export default appWithTranslation(MyApp);
