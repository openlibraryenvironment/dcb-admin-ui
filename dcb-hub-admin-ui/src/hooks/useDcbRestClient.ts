import { useMemo } from "react";
import { useRouter } from "@tanstack/react-router";
import { createRestClient } from "@helpers/createRestClient";

export const useDcbRestClient = () => {
	// Pull directly from TanStack's active synchronized context tree, exactly as
	// useGraphQLClient does.
	const { cfg, auth } = useRouter().options.context as { cfg: any; auth: any };

	// Keyed on the primitive API base + access token rather than the whole
	// cfg/auth objects, which change identity frequently.
	return useMemo(
		() => createRestClient(cfg, auth),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[cfg?.VITE_DCB_API_BASE, auth?.user?.access_token],
	);
};
