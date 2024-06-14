import { onError } from "@apollo/client/link/error";

export const errorLink = onError(({ graphQLErrors, networkError }) => {
	// Aim is for this to trigger a retry on token expiry - for now it's just a basic implementation
	if (graphQLErrors)
		graphQLErrors.forEach(({ message, locations, path }) =>
			console.log(
				`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
			),
		);
	if (networkError) {
		console.log(`[Network error]: ${networkError}`);
		console.log(networkError.message);
	}
});
