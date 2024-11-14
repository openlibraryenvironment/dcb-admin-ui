import { create } from "zustand";

import { persist } from "zustand/middleware";

type ConsortiumInfo = {
	name: string;
	displayName: string;
	headerImageURL: string;
	aboutImageURL: string;
	description: string;
	searchCatalogueUrl: string;
	websiteUrl: string;
};

type ConsortiumActions = {
	setHeaderImageURL: (headerImageURL: string) => void;
	setAboutImageURL: (aboutImageURL: string) => void;
	setDisplayName: (displayName: string) => void;
	clearConsortiumStore: () => void;
};

// Do we need to do a fetch in here?
export const useConsortiumInfoStore = create<
	ConsortiumInfo & ConsortiumActions
>()(
	persist(
		(set) => ({
			name: "",
			displayName: "",
			headerImageURL: "", // Somehow this needs to default to the existing URL on the DB
			aboutImageURL: "",
			description: "",
			searchCatalogueUrl: "",
			websiteUrl: "",

			setHeaderImageURL: (headerImageURL: string) => set({ headerImageURL }),
			setAboutImageURL: (aboutImageURL: string) => set({ aboutImageURL }),
			setDisplayName: (displayName: string) => set({ displayName }),

			// Do we need to call this on logout at all?
			clearConsortiumStore: () =>
				set(() => ({
					name: "",
					headerImageURL: "",
					aboutImageURL: "",
					description: "",
					searchCatalogueUrl: "",
					websiteUrl: "",
					displayName: "",
				})),
		}),
		{
			name: "consortium-storage",
		},
	),
);
