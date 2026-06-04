import { GraphQLClient } from "graphql-request";
import { useAuth } from "react-oidc-context";
import { useRouter } from "@tanstack/react-router";
import { useMemo } from "react";

export const useGraphQLClient = () => {
	const auth = useAuth();
	const { cfg } = useRouter().options.context as { cfg: any };

	return useMemo(() => {
		const endpoint = `${cfg.VITE_DCB_API_BASE}/graphql`;
		const token = auth.user?.access_token;

		return new GraphQLClient(endpoint, {
			headers: {
				...(token && { Authorization: `Bearer ${token}` }),
			},
		});
	}, [cfg.VITE_DCB_API_BASE, auth.user?.access_token]);
};
