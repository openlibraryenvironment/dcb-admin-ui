import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import axios from "axios";

interface VersionInfo {
	version: string | null;
	isDev: boolean;
	isAcceptableVersion: boolean;
	loading: boolean;
	error: string | null;
	type: string | null;
	branch: string | null;
	lastFetchedAt: number | null;
	fetchVersionInfo: () => Promise<void>;
	clearVersionStore: () => void;
}

const useDCBVersionStore = create<VersionInfo>()(
	persist(
		(set) => ({
			version: null,
			isDev: false,
			isAcceptableVersion: true,
			loading: false,
			error: null,
			type: null,
			branch: null,
			lastFetchedAt: null,

			fetchVersionInfo: async () => {
				set({ loading: true, error: null });

				try {
					// In Vite, we don't need getConfig(). We just hit our /api proxy
					// which automatically routes to VITE_DCB_API_BASE
					const response = await axios.get("/api/info");
					const data = response.data;

					const versionStr = data.version || "";
					const isDev = versionStr.includes("SNAPSHOT");

					// Update state with the fetched data
					set({
						version: data.version || "Unknown",
						isDev,
						// Add any custom acceptable version logic here if you had it
						isAcceptableVersion: true,
						type: data.environmentType || "Production",
						branch: data.branch || "main",
						lastFetchedAt: Date.now(),
						loading: false,
					});
				} catch (error: any) {
					console.error("Failed to fetch DCB service info:", error);
					set({
						error: error.message || "Failed to fetch version info",
						loading: false,
					});
				}
			},

			clearVersionStore: () => {
				set({
					version: null,
					isDev: false,
					isAcceptableVersion: true,
					loading: false,
					error: null,
					type: null,
					branch: null,
					lastFetchedAt: null,
				});
			},
		}),
		{
			name: "dcb-version-storage",
			storage: createJSONStorage(() => sessionStorage),
		},
	),
);

export default useDCBVersionStore;
