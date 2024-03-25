import {
	ApolloClient,
	HttpLink,
	InMemoryCache,
	createHttpLink,
} from "@apollo/client";
import getConfig from "next/config";

const { publicRuntimeConfig } = getConfig();

const createApolloClient = (accessToken: any) => {
	const httpLink = createHttpLink({
		uri: publicRuntimeConfig.DCB_API_BASE + "/graphql",
		credentials: "include",
		headers: {
			authorization: accessToken ? `Bearer ${accessToken}` : "",
		},
	});

	return new ApolloClient({
		link: httpLink,
		cache: new InMemoryCache(),
	});
};

export default createApolloClient;

// Must be extended to fully support SSR
// https://github.com/apollographql/next-apollo-example/blob/main/lib/apolloClient.js
