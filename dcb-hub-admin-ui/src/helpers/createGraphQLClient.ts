import { GraphQLClient } from "graphql-request";

// Plain-function extraction of useGraphQLClient's client-construction logic
// so it can also be called from route loaders, which run outside React
// (can't call hooks). useGraphQLClient wraps this in a useMemo for components.
export function createGraphQLClient(cfg: any, auth: any) {
	const endpoint = `${cfg?.VITE_DCB_API_BASE || ""}/graphql`;
	const token = auth?.user?.access_token;

	return new GraphQLClient(endpoint, {
		headers: {
			...(token && { Authorization: `Bearer ${token}` }),
		},
	});
}
