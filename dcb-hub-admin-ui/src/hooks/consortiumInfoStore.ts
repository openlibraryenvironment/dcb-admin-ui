import { create } from "zustand";

import { persist } from "zustand/middleware";

import { storageKey } from "@helpers/appBase";

type ConsortiumInfo = {
	name: string;
	displayName: string;
	headerImageURL: string;
	aboutImageURL: string;
	description: string;
	catalogueSearchURL: string;
	websiteURL: string;
};

/** What the header shows before any consortium has been created, and after one is gone. */
const DEFAULTS: ConsortiumInfo = {
	name: "OpenRS Consortium",
	displayName: "OpenRS Consortium",
	headerImageURL: "",
	aboutImageURL: "",
	description: "",
	catalogueSearchURL: "",
	websiteURL: "",
};

type ConsortiumActions = {
	setName: (name: string) => void;
	setHeaderImageURL: (headerImageURL: string) => void;
	setAboutImageURL: (aboutImageURL: string) => void;
	setDisplayName: (displayName: string) => void;
	setWebsiteURL: (websiteUrl: string) => void;
	setCatalogueSearchURL: (catalogueSearchUrl: string) => void;
	setDescription: (description: string) => void;
	resetConsortiumStore: () => void;
};

export const useConsortiumInfoStore = create<
	ConsortiumInfo & ConsortiumActions
>()(
	persist(
		(set) => ({
			...DEFAULTS,

			// Build a combined setter
			setName: (name: string) => set({ name }),
			setHeaderImageURL: (headerImageURL: string) => set({ headerImageURL }),
			setAboutImageURL: (aboutImageURL: string) => set({ aboutImageURL }),
			setDisplayName: (displayName: string) => set({ displayName }),
			setWebsiteURL: (websiteURL: string) => set({ websiteURL }),
			setCatalogueSearchURL: (catalogueSearchURL: string) =>
				set({ catalogueSearchURL }),
			setDescription: (description: string) => set({ description }),

			// Answering the question this used to ask itself ("do we need to call this on
			// logout at all?"): no. The key is deliberately exempt from the sign-out purge,
			// because the logout screen renders "your session with {consortium} has ended"
			// and has no token left to fetch that name with.
			//
			// What IS needed is a reset for when the consortium is GONE - deleted, or the
			// deployment rebuilt. Nothing used to do that, so a name outlived the record it
			// described and there was no sequence of actions in the application that could
			// clear it. It restores the DEFAULTS rather than blanking the fields: an empty
			// header is not the answer to "there is no consortium yet", which is exactly the
			// state a first run is in.
			resetConsortiumStore: () => set(() => ({ ...DEFAULTS })),
		}),
		{
			name: storageKey("consortium-storage"),
		},
	),
);
