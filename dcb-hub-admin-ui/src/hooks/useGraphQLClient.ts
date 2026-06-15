import { useMemo } from "react";
import { useRouter } from "@tanstack/react-router";
import { GraphQLClient } from "graphql-request";

export const useGraphQLClient = () => {
	// Pull directly from TanStack's active synchronized context tree
	const { cfg, auth } = useRouter().options.context as { cfg: any; auth: any };

	console.log(cfg, auth);

	return useMemo(() => {
		const endpoint = `${cfg?.VITE_DCB_API_BASE || ""}/graphql`;

		const token = auth?.user?.access_token;

		return new GraphQLClient(endpoint, {
			headers: {
				...(token && { Authorization: `Bearer ${token}` }),
			},
		});
	}, [cfg?.VITE_DCB_API_BASE, auth?.user?.access_token]);
};
