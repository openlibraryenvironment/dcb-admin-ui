import { create } from "zustand";
import { persist } from "zustand/middleware";

import { storageKey } from "@helpers/appBase";
import { isLanguageChoice, type LanguageChoice } from "@helpers/locale";

type LocalePreference = {
	/** Per user and stored in this browser, like the appearance settings beside it. */
	choice: LanguageChoice;
	setChoice: (choice: LanguageChoice) => void;
};

export const useLocaleStore = create<LocalePreference>()(
	persist(
		(set) => ({
			choice: "deployment",
			setChoice: (choice) =>
				set({ choice: isLanguageChoice(choice) ? choice : "deployment" }),
		}),
		{
			name: storageKey("dcb-admin-locale"),
			// Validated on the way out of storage too: a value written by another build
			// never passes through setChoice.
			merge: (persisted, current) => {
				const stored = (persisted ?? {}) as Partial<LocalePreference>;
				return {
					...current,
					choice: isLanguageChoice(stored.choice)
						? stored.choice
						: "deployment",
				};
			},
		},
	),
);
