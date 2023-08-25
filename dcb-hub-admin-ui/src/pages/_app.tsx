import * as React from 'react';
import '@styles/globals.scss';
import type { AppProps } from 'next/app';
// Next.js allows you to import CSS directly in .js files.
// It handles optimization and all the necessary Webpack configuration to make this work.
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';

import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider, Hydrate } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ProgressBar } from '@components/ProgressBar';

// You change this configuration value to false so that the Font Awesome core SVG library
// will not try and insert <style> elements into the <head> of the page.
// Next.js blocks this from happening anyway so you might as well not even try.
// See https://fontawesome.com/v6/docs/web/use-with/react/use-with#next-js
config.autoAddCss = false;

function MyApp({ Component, pageProps }: AppProps) {
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

	// In server-side rendered applications, a SSRProvider must wrap the application in order
	// to ensure that the auto-generated ids are consistent between the server and client.
	// https://react-bootstrap.github.io/getting-started/server-side-rendering/
	return (
			<QueryClientProvider client={queryClient}>
			<Hydrate state={pageProps.dehydratedState}>
				<SessionProvider session={pageProps.session}>
						<ProgressBar />
						<Component {...pageProps} />
				</SessionProvider>
			</Hydrate>
			<ReactQueryDevtools initialIsOpen={false} />
		</QueryClientProvider>
	);
}

export default MyApp;
