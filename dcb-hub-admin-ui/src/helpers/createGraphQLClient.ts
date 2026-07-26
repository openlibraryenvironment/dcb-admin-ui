import { GraphQLClient } from "graphql-request";

export function resolveGraphQLEndpoint(
	apiBase: string,
	origin = globalThis.location?.origin,
) {
	const endpoint = `${apiBase.replace(/\/$/, "")}/graphql`;
	return origin ? new URL(endpoint, `${origin}/`).toString() : endpoint;
}

// Plain-function extraction of useGraphQLClient's client-construction logic
// so it can also be called from route loaders, which run outside React
// (can't call hooks). useGraphQLClient wraps this in a useMemo for components.
export function createGraphQLClient(cfg: any, auth: any) {
	const endpoint = resolveGraphQLEndpoint(cfg?.VITE_DCB_API_BASE || "");
	const token = auth?.user?.access_token;

	return new GraphQLClient(endpoint, {
		headers: {
			...(token && { Authorization: `Bearer ${token}` }),
		},
	});
}
