import { useMemo } from "react";
import { useRouter } from "@tanstack/react-router";
import { createGraphQLClient } from "@helpers/createGraphQLClient";

export const useGraphQLClient = () => {
	// Pull directly from TanStack's active synchronized context tree
	const { cfg, auth } = useRouter().options.context as { cfg: any; auth: any };

	// Intentionally keyed on the primitive API base + access token rather than the
	// whole cfg/auth context objects, which change identity frequently and would
	// recreate the client on every context update.
	return useMemo(
		() => createGraphQLClient(cfg, auth),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[cfg?.VITE_DCB_API_BASE, auth?.user?.access_token],
	);
};
