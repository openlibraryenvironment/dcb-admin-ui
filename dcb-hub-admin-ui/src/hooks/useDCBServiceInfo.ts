import { useEffect } from "react";
import useDCBVersionStore from "./serviceInfoStore";

const useDCBServiceInfo = () => {
	const {
		version,
		isDev,
		isAcceptableVersion,
		loading,
		error,
		type,
		branch,
		fetchVersionInfo,
		lastFetchedAt,
	} = useDCBVersionStore();
	const REQUEST_DELAY = 2 * 60 * 60 * 1000; // 2 hours in miliseconds - this stops us making constant requests for the service info

	useEffect(() => {
		if (
			!lastFetchedAt ||
			Date.now() - lastFetchedAt >= REQUEST_DELAY ||
			lastFetchedAt == null
		) {
			fetchVersionInfo();
		}
	}, [lastFetchedAt, fetchVersionInfo, REQUEST_DELAY]);

	return { version, isDev, isAcceptableVersion, loading, error, type, branch };
};

export default useDCBServiceInfo;
