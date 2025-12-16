import { create } from "zustand";
import axios from "axios";
import getConfig from "next/config";
import { persist } from "zustand/middleware";

interface DCBVersionInfo {
	version: string | null;
	isDev: boolean;
	isAcceptableVersion: boolean;
	type: string | null;
	branch: string | null;
	lastFetchedAt: number | null;
}

interface DCBVersionState extends DCBVersionInfo {
	loading: boolean;
	error: Error | null;
	fetchVersionInfo: () => Promise<void>;
}

const { publicRuntimeConfig } = getConfig();

const useDCBVersionStore = create<DCBVersionState>()(
	persist(
		(set) => ({
			version: null,
			isDev: false,
			isAcceptableVersion: false,
			lastFetchedAt: null,
			loading: false,
			error: null,
			type: null,
			branch: null,
			fetchVersionInfo: async () => {
				const currentTime = Date.now();
				set({ loading: true });
				const fetchUrl = `${publicRuntimeConfig?.DCB_API_BASE}/info`;
				try {
					// const response = await axios.get(
					// 	`${publicRuntimeConfig?.DCB_API_BASE}/info`,
					// );
					let response;

					try {
						response = await axios.get(fetchUrl);
					} catch (firstErr: any) {
						// If 503, wait briefly and retry
						// Just in case it is a temp disruption
						if (firstErr.response?.status === 503) {
							console.log("503 received. Retrying...");
							response = await axios.get(fetchUrl);
						} else {
							throw firstErr;
						}
					}

					const version = response.data.git?.tags || null;
					const systemType = response.data.env.code || "NOT SET";
					const branch = response.data.git?.branch || "";

					const isDev =
						systemType.includes("DEV") || branch.toLowerCase() === "main";

					console.log("IS DEV" + isDev);

					const determineAcceptableVersion = (
						version: string | null,
						isDev: boolean,
					) => {
						if (version) {
							const numericVersion = version.substring(1);
							const [major, minor] = numericVersion.split(".").map(Number);
							return major > 7 || (major === 7 && minor >= 3) || isDev;
						} else {
							return isDev;
						}
					};

					const isAcceptableVersion = determineAcceptableVersion(
						version,
						isDev,
					);

					set({
						version,
						isDev,
						isAcceptableVersion,
						lastFetchedAt: currentTime,
						loading: false,
						error: null,
						type: systemType,
						branch,
					});
				} catch (error: any) {
					console.error("Error fetching DCB Service version:", error);
					if (error?.response?.status === 503) {
						if (
							typeof window !== "undefined" &&
							window.location.pathname !== "/maintenance"
						) {
							window.location.href = "/maintenance";
						}
					}
					set({
						error:
							error instanceof Error ? error : new Error("An error occurred"),
						loading: false,
						lastFetchedAt: currentTime, // Stops getting stuck in an error state.
					});
				}
			},
		}),
		{
			name: "dcb-version-storage",
		},
	),
);

export default useDCBVersionStore;
