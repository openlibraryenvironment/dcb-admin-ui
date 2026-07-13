import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import useDCBVersionStore from "./serviceInfoStore";

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

	return { version, isDev, isAcceptableVersion, loading, error, type, branch };
};

export default useDCBServiceInfo;
