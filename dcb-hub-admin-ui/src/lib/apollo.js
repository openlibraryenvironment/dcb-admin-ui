import { useRef } from "react";
import { ApolloClient, HttpLink, InMemoryCache, from } from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { setContext } from "@apollo/client/link/context";
import merge from "deepmerge";
import isEqual from "lodash/isEqual";
import { getSession } from "next-auth/react";
import getConfig from "next/config";

export const APOLLO_STATE_PROP_NAME = "__APOLLO_STATE__";

let apolloClient;

const { publicRuntimeConfig } = getConfig();

// Error handling link
const errorLink = onError(
	({ graphQLErrors, networkError, operation, forward }) => {
		if (graphQLErrors) {
			for (let err of graphQLErrors) {
				// Handle 401 errors by attempting to refresh the token
				if (err.extensions?.code === "UNAUTHENTICATED") {
					// Retry the query once after attempting to refresh the token
					return forward(operation);
				}

				console.log(
					`[GraphQL error]: Message: ${err.message}, Location: ${err.locations}, Path: ${err.path}`,
				);
			}
		}
		if (networkError) console.log(`[Network error]: ${networkError}`);
	},
);

// Authentication link to add the token to requests
const authLink = setContext(async (_, { headers }) => {
	// Get the authentication token from NextAuth session
	const session = await getSession();
	const token = session?.accessToken;

	// Return the headers to the context so httpLink can read them
	return {
		headers: {
			...headers,
			authorization: token ? `Bearer ${token}` : "",
		},
	};
});

const httpLink = new HttpLink({
	uri: publicRuntimeConfig.DCB_API_BASE + "/graphql",
});

function createApolloClient() {
	return new ApolloClient({
		ssrMode: typeof window === "undefined",
		link: from([errorLink, authLink, httpLink]),
		cache: new InMemoryCache(),
		defaultOptions: {
			watchQuery: {
				fetchPolicy: "network-only",
			},
			query: {
				fetchPolicy: "network-only",
				errorPolicy: "all",
			},
		},
	});
}

export function initializeApollo(initialState = null) {
	const _apolloClient = apolloClient ?? createApolloClient();

	if (initialState) {
		const existingCache = _apolloClient.extract();

		const data = merge(existingCache, initialState, {
			arrayMerge: (destinationArray, sourceArray) => [
				...sourceArray,
				...destinationArray.filter((d) =>
					sourceArray.every((s) => !isEqual(d, s)),
				),
			],
		});

		_apolloClient.cache.restore(data);
	}

	// For SSG and SSR always create a new Apollo Client
	if (typeof window === "undefined") return _apolloClient;

	// Create the Apollo Client once in the client
	if (!apolloClient) apolloClient = _apolloClient;
	return _apolloClient;
}

export function addApolloState(client, pageProps) {
	if (pageProps?.props) {
		pageProps.props[APOLLO_STATE_PROP_NAME] = client.cache.extract();
	}
	return pageProps;
}

export function useApollo(pageProps) {
	// Add null check and default value for pageProps
	const state = pageProps?.[APOLLO_STATE_PROP_NAME] ?? null;
	const storeRef = useRef();

	if (!storeRef.current) {
		storeRef.current = initializeApollo(state);
	}

	return storeRef.current;
}
