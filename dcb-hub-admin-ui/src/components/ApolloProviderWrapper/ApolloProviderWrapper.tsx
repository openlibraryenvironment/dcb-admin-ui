import { PropsWithChildren, useMemo } from "react";
import {
	ApolloClient,
	ApolloProvider,
	HttpLink,
	InMemoryCache,
	from,
} from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { setContext } from "@apollo/client/link/context";
import { useSession } from "next-auth/react";
import getConfig from "next/config";

export const ApolloProviderWrapper = ({ children }: PropsWithChildren) => {
	const { data: session, status } = useSession();
	const isSessionLoading = status === "loading";
	const token = session?.accessToken;

	const errorLink = onError(({ graphQLErrors, networkError }) => {
		// Aim is for this to trigger a retry on token expiry - for now it's just a basic implementation
		if (graphQLErrors)
			graphQLErrors.forEach(({ message, locations, path }) =>
				console.log(
					`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
				),
			);
		if (networkError) console.log(`[Network error]: ${networkError}`);
	});

	const url = useMemo(() => {
		const { publicRuntimeConfig } = getConfig();
		return new HttpLink({
			uri: publicRuntimeConfig.DCB_API_BASE + "/graphql",
			headers: {
				authorization: token ? `Bearer ${token}` : "",
			},
		});
	}, [token]);

	const client = useMemo(() => {
		const authMiddleware = setContext((operation, { headers }) => {
			const token = session?.accessToken;
			return {
				headers: {
					...headers,
					authorization: token ? `Bearer ${token}` : "",
				},
			};
		});

		// const retryLink = new RetryLink({
		// 	delay: {
		// 		initial: 300,
		// 		max: Infinity,
		// 		jitter: true,
		// 	},
		// 	attempts: {
		// 		max: 5,
		// 		retryIf: (error, _operation) => {
		// 			// Log retry attempt
		// 			console.log(
		// 				"[RetryLink]: Retrying request due to error:",
		// 				error,
		// 				"and operation" + _operation,
		// 			);
		// 			return !!error;
		// 		},
		// 	},
		// });

		return new ApolloClient({
			link: from([errorLink, authMiddleware, url]),
			cache: new InMemoryCache(),
			ssrMode: true,
		});
	}, [url, errorLink, session?.accessToken]);

	// Wait to initialise the client until the session has loaded.
	// This means nothing will be rendered until then.
	if (isSessionLoading) {
		return null;
	}

	return <ApolloProvider client={client}>{children}</ApolloProvider>;
};
