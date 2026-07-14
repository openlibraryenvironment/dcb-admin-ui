import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { storageKey } from "@helpers/appBase";

interface SidebarState {
	sidebarOpen: boolean;
}

interface SidebarActions {
	setSidebarOpen: (open: boolean) => void;
	toggleSidebar: () => void;
}

// Persisted preference for the DESKTOP (>= md) docked sidebar's visibility;
// defaults to visible and is toggled by the Header menu button. The mobile
// (< md) overlay uses its own transient state in StructuralLayout so a mobile
// page load is never covered on first paint. localStorage (not sessionStorage)
// so the preference survives across sessions, not just tabs.
export const useSidebarStore = create<SidebarState & SidebarActions>()(
	persist(
		(set) => ({
			sidebarOpen: true,

			setSidebarOpen: (open) => set({ sidebarOpen: open }),
			toggleSidebar: () =>
				set((state) => ({ sidebarOpen: !state.sidebarOpen })),
		}),
		{
			name: storageKey("sidebar-storage"),
			storage: createJSONStorage(() => localStorage),
		},
	),
);
