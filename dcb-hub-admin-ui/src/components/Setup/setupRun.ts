import { createContext, useContext, useEffect } from "react";

import type { ConsortiumSetupStepId } from "@helpers/consortiumSetup";

/**
 * What is true about THIS pass through setup, and nothing beyond it.
 *
 * Two pieces of state, both deliberately in memory only:
 *
 *  - **unsaved work**, so leaving a chapter mid-edit can ask first;
 *  - **which chapters have been visited**, so the optional first chapter can show as done
 *    once the user has been through it.
 *
 * <h2>Why none of this is persisted</h2>
 *
 * It was, once, and that is exactly what went wrong: "the user has seen the appearance
 * chapter" lived in localStorage and was read as deployment progress, so a freshly wiped
 * database opened in the same browser reported a chapter it had never had as complete. See
 * `consortiumSetup.ts` on why appearance is optional.
 *
 * Per-run state cannot make that mistake. A reload resets it, which costs a tick in the
 * rail and is the right trade: a tick that is briefly missing is a smaller lie than one
 * that is confidently wrong about a system it has never seen.
 *
 * <h2>Why a context and not a store</h2>
 *
 * The state is produced by the chapters and consumed by the frame around them - a
 * parent/child relationship inside one route, which is what context is for. A Zustand store
 * would make it global and outlive the route it describes.
 */
export interface SetupRunValue {
	isDirty: boolean;
	registerDirty: (id: string, dirty: boolean) => void;
	unregisterDirty: (id: string) => void;
	visited: readonly ConsortiumSetupStepId[];
	markVisited: (id: ConsortiumSetupStepId) => void;
}

export const SetupRunContext = createContext<SetupRunValue | undefined>(
	undefined,
);

/** Read by the layout, to decide whether leaving needs a warning. */
export function useSetupDirty(): boolean {
	return useContext(SetupRunContext)?.isDirty ?? false;
}

/** Read by the rail, to decide whether an optional chapter has been dealt with. */
export function useVisitedChapters(): readonly ConsortiumSetupStepId[] {
	return useContext(SetupRunContext)?.visited ?? [];
}

/**
 * Called by a chapter with its own unsaved state.
 *
 * Safe outside the provider — it simply does nothing — so a chapter can be rendered in a
 * test without dragging the whole layout in.
 */
export function useRegisterSetupDirty(id: string, isDirty: boolean) {
	const context = useContext(SetupRunContext);
	const registerDirty = context?.registerDirty;
	const unregisterDirty = context?.unregisterDirty;

	useEffect(() => {
		registerDirty?.(id, isDirty);
	}, [registerDirty, id, isDirty]);

	// Separate effect so the cleanup depends only on the id, not on the dirty flag -
	// otherwise every keystroke would unregister and re-register, and the map would
	// briefly read clean in between.
	useEffect(() => () => unregisterDirty?.(id), [unregisterDirty, id]);
}

/**
 * The actions a chapter takes on the run, for callers that are not components rendering
 * inside a chapter - the navigation hook, principally.
 *
 * Returns a no-op outside the provider so the hook stays safe to call from a test.
 */
export function useSetupRunActions(): Pick<SetupRunValue, "markVisited"> {
	const context = useContext(SetupRunContext);

	return { markVisited: context?.markVisited ?? (() => {}) };
}
