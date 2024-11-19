import { create } from "zustand";

import { persist } from "zustand/middleware";

type ConsortiumInfo = {
	name: string;
	displayName: string;
	headerImageURL: string;
	aboutImageURL: string;
	description: string;
	catalogueSearchURL: string;
	websiteURL: string;
};

type ConsortiumActions = {
	setHeaderImageURL: (headerImageURL: string) => void;
	setAboutImageURL: (aboutImageURL: string) => void;
	setDisplayName: (displayName: string) => void;
	setWebsiteURL: (websiteUrl: string) => void;
	setCatalogueSearchURL: (catalogueSearchUrl: string) => void;
	setDescription: (description: string) => void;
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
			catalogueSearchURL: "",
			websiteURL: "",

			// Build a combined setter
			setHeaderImageURL: (headerImageURL: string) => set({ headerImageURL }),
			setAboutImageURL: (aboutImageURL: string) => set({ aboutImageURL }),
			setDisplayName: (displayName: string) => set({ displayName }),
			setWebsiteURL: (websiteURL: string) => set({ websiteURL }),
			setCatalogueSearchURL: (catalogueSearchURL: string) =>
				set({ catalogueSearchURL }),
			setDescription: (description: string) => set({ description }),

			// Do we need to call this on logout at all?
			clearConsortiumStore: () =>
				set(() => ({
					name: "",
					headerImageURL: "",
					aboutImageURL: "",
					description: "",
					catalogueSearchURL: "",
					websiteURL: "",
					displayName: "",
				})),
		}),
		{
			name: "consortium-storage",
		},
	),
);
