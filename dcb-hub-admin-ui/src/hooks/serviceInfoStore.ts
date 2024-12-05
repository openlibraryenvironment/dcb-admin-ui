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
				try {
					const response = await axios.get(
						`${publicRuntimeConfig?.DCB_API_BASE}/info`,
					);
					const version = response.data.git?.tags || null;
					const systemType = response.data.env.code || "NOT SET";
					const branch = response.data.git?.branch || "";

					const isDev =
						systemType.includes("DEV") || branch.toLowerCase() === "main";

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
				} catch (error) {
					console.error("Error fetching DCB Service version:", error);
					set({
						error:
							error instanceof Error ? error : new Error("An error occurred"),
						loading: false,
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
