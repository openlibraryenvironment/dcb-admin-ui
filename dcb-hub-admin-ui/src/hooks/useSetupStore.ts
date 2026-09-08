import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { ConsortiumSetupStepId } from "@helpers/consortiumSetup";
import { storageKey } from "@helpers/appBase";

/**
 * The only part of setup progress that is NOT derivable from the data — W-5.
 *
 * Everything a chapter writes is read back out of dcb-service, so this store holds no copy
 * of it. What it holds is the decisions that leave no trace: "we do not want discovery
 * branding", "I have already seen the appearance screen", "stop showing me the banner". A
 * skip is a real answer, and a flow that cannot record one asks the same question forever.
 *
 * Client UI state, so zustand - never a mirror of a query result.
 */

interface SetupPreferences {
	skipped: ConsortiumSetupStepId[];
	/** Where "continue" resumes when the data does not pin a chapter down. */
	lastVisited: ConsortiumSetupStepId | null;
	/**
	 * Whether the user has dismissed the "finish setting up" banner. Separate from the
	 * skips: dismissing the banner hides the prompt, it does not answer any chapter.
	 */
	bannerDismissed: boolean;
}

interface SetupActions {
	skip: (step: ConsortiumSetupStepId) => void;
	unskip: (step: ConsortiumSetupStepId) => void;
	setLastVisited: (step: ConsortiumSetupStepId) => void;
	dismissBanner: () => void;
	reset: () => void;
}

const EMPTY: SetupPreferences = {
	skipped: [],
	lastVisited: null,
	bannerDismissed: false,
};

export const useSetupStore = create<SetupPreferences & SetupActions>()(
	persist(
		(set) => ({
			...EMPTY,
			skip: (step) =>
				set((state) =>
					state.skipped.includes(step)
						? state
						: { skipped: [...state.skipped, step] },
				),
			// Revisiting a chapter and answering it properly has to be able to undo the
			// skip, or the finish screen keeps reporting work the user has since done.
			unskip: (step) =>
				set((state) => ({
					skipped: state.skipped.filter((id) => id !== step),
				})),
			setLastVisited: (lastVisited) => set({ lastVisited }),
			dismissBanner: () => set({ bannerDismissed: true }),
			reset: () => set(EMPTY),
		}),
		{ name: storageKey("dcb-admin-setup") },
	),
);
