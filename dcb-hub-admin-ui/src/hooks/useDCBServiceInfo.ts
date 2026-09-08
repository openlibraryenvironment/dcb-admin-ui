import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import useDCBVersionStore from "./serviceInfoStore";
import { areBrandUploadsAvailable } from "@constants/discoveryBranding";
import { isConsortiumBrandingEnabled } from "@helpers/featureFlags";

// Stop constant /info requests: the service version changes rarely.
const REQUEST_DELAY = 2 * 60 * 60 * 1000; // 2 hours

const useDCBServiceInfo = () => {
	// Same runtime-config source as useGraphQLClient / useDcbRestClient. T
	const { cfg } = useRouter().options.context as { cfg: any };
	const apiBase = cfg?.VITE_DCB_API_BASE;
	const version = useDCBVersionStore((state) => state.version);
	const isDev = useDCBVersionStore((state) => state.isDev);
	const isAcceptableVersion = useDCBVersionStore(
		(state) => state.isAcceptableVersion,
	);
	const loading = useDCBVersionStore((state) => state.loading);
	const error = useDCBVersionStore((state) => state.error);
	const type = useDCBVersionStore((state) => state.type);
	const branch = useDCBVersionStore((state) => state.branch);
	const brandAssetStore = useDCBVersionStore((state) => state.brandAssetStore);
	const lastFetchedAt = useDCBVersionStore((state) => state.lastFetchedAt);
	const fetchedFrom = useDCBVersionStore((state) => state.fetchedFrom);
	const fetchVersionInfo = useDCBVersionStore(
		(state) => state.fetchVersionInfo,
	);

	useEffect(() => {
		if (!apiBase) return;
		const staleEnvironment = fetchedFrom !== apiBase;
		const staleAge =
			!lastFetchedAt || Date.now() - lastFetchedAt >= REQUEST_DELAY;

		if (staleEnvironment || staleAge) {
			fetchVersionInfo(apiBase);
		}
	}, [apiBase, lastFetchedAt, fetchedFrom, fetchVersionInfo]);

	return {
		version,
		isDev,
		isAcceptableVersion,
		loading,
		error,
		type,
		branch,
		brandAssetStore,
		/**
		 * Whether to offer brand image upload controls.
		 *
		 * Two independent facts, and both have to hold. The flag says whether this
		 * deployment's dcb-service has the brand columns at all (9.0.0 registers the
		 * upload controller; 8.71.0 has neither the route nor anywhere to store the
		 * URL). The /info asset store then says whether a 9.0.0 configured with
		 * dcb.branding.assets.store=none registered it. See areBrandUploadsAvailable
		 * for why an UNKNOWN store still counts as available.
		 */
		brandUploadsAvailable:
			isConsortiumBrandingEnabled() &&
			areBrandUploadsAvailable(brandAssetStore),
	};
};

export default useDCBServiceInfo;
