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
	setName: (name: string) => void;
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
			// Intended to display when no consortium is available.
			name: "OpenRS Consortium",
			displayName: "OpenRS Consortium",
			headerImageURL:
				"https://djlwg7trj3cacjdl.public.blob.vercel-storage.com/openRS%20icon%2036x36-TOMOoGP4vWmtfOKjXyq7BKLaDmOiJO.png", // Somehow this needs to default to the existing URL on the DB
			aboutImageURL:
				"https://djlwg7trj3cacjdl.public.blob.vercel-storage.com/OpenDCB%20logo%20x48-xwNhL87RH5fpgHPlbffsfvJAp9gOXz.png",
			// aboutImageURL: "",
			description: "",
			catalogueSearchURL: "",
			websiteURL: "",

			// Build a combined setter
			setName: (name: string) => set({ name }),
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
