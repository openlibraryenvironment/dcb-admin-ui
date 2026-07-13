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
	fetchedFrom: string | null;
	fetchVersionInfo: (apiBase: string) => Promise<void>;
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
			fetchedFrom: null,

			// The API base MUST be supplied by the caller from the runtime config
			// (inject_env.json), not read from import.meta.env: .dockerignore excludes
			// .env, so in the production image import.meta.env.VITE_DCB_API_BASE bakes
			// to the literal `undefined` and "undefined/info" resolves against the
			// admin host, where nginx's SPA fallback answers 200 with index.html.
			fetchVersionInfo: async (apiBase: string) => {
				if (!apiBase) {
					set({ error: "No DCB API base configured", loading: false });
					return;
				}
				set({ loading: true, error: null });

				try {
					const response = await axios.get(apiBase + "/info");
					const data = response.data;

					const versionStr = data.version || "";
					const isDev = versionStr.includes("SNAPSHOT");

					// Update state with the fetched data
					set({
						version: data.version || "Unknown",
						isDev,
						isAcceptableVersion: true,
						type: data.env.code || "",
						branch: data.branch || "main",
						lastFetchedAt: Date.now(),
						fetchedFrom: apiBase,
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
					type: "",
					branch: null,
					lastFetchedAt: null,
					fetchedFrom: null,
				});
			},
		}),
		{
			name: "dcb-version-storage",
			storage: createJSONStorage(() => sessionStorage),
			// Bumped to discard caches written before the runtime-config fix; those
			// hold an environment type fetched from the wrong /info endpoint.
			version: 1,
			// Only the fetched payload is worth caching. Persisting `loading`/`error`
			// meant a reload mid-request rehydrated a stale transient state.
			partialize: (state) => ({
				version: state.version,
				isDev: state.isDev,
				isAcceptableVersion: state.isAcceptableVersion,
				type: state.type,
				branch: state.branch,
				lastFetchedAt: state.lastFetchedAt,
				fetchedFrom: state.fetchedFrom,
			}),
		},
	),
);

export default useDCBVersionStore;
