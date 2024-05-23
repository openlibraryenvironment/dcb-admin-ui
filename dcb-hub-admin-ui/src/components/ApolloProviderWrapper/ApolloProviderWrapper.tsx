import { PropsWithChildren, useMemo } from "react";
import {
	ApolloClient,
	ApolloProvider,
	HttpLink,
	InMemoryCache,
	from,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { useSession } from "next-auth/react";
import getConfig from "next/config";

export const ApolloProviderWrapper = ({ children }: PropsWithChildren) => {
	const { data: session, status } = useSession();
	const isSessionLoading = status === "loading";
	const token = session?.accessToken;

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

		return new ApolloClient({
			link: from([authMiddleware, url]),
			cache: new InMemoryCache(),
			ssrMode: true,
		});
	}, [url, session?.accessToken]);

	// Wait to initialise the client until the session has loaded.
	// This means nothing will be rendered until then.
	if (isSessionLoading) {
		return null;
	}

	return <ApolloProvider client={client}>{children}</ApolloProvider>;
};
