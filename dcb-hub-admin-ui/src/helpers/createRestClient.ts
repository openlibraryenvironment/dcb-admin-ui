import axios, { AxiosInstance } from "axios";

// Plain-function extraction mirroring createGraphQLClient, so the same client can
// be constructed inside route loaders (which run outside React and cannot call
// hooks) and inside components via useDcbRestClient. The DCB stats endpoints are
// REST, not GraphQL, so they need their own bearer-authenticated axios instance.
export function createRestClient(cfg: any, auth: any): AxiosInstance {
	const token = auth?.user?.access_token;

	return axios.create({
		baseURL: cfg?.VITE_DCB_API_BASE || "",
		headers: {
			...(token && { Authorization: `Bearer ${token}` }),
		},
	});
}
