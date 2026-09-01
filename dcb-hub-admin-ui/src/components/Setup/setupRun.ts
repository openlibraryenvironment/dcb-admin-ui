import { createContext, useCallback, useContext, useEffect } from "react";

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
 *
 * <h2>Why unsaved work is a ref and not React state</h2>
 *
 * The navigation guard asks "is anything unsaved?" at the instant a navigation is
 * attempted, and acts on the answer immediately. React state cannot answer that question:
 * a chapter settles its form and navigates in the same tick, so a `useState` value is still
 * the one from before the save when the guard reads it, and the user is warned they are
 * about to lose work that has this moment been written to the server.
 *
 * Nothing RENDERS from this flag - only the blocker's two callbacks read it, and both are
 * called at decision time - so state was buying re-renders and a staleness bug and nothing
 * else. `isDirtyNow()` reads a ref, which is current by definition.
 *
 * `visited` stays state, because the rail does render from it.
 */
export interface SetupRunValue {
	/** Called at the moment a navigation is attempted, so it must not be a snapshot. */
	isDirtyNow: () => boolean;
	registerDirty: (id: string, dirty: boolean) => void;
	unregisterDirty: (id: string) => void;
	/**
	 * Forget every unsaved-work claim, at once and synchronously.
	 *
	 * Called by the flow's own Continue. A chapter settles its form with `reset()` before
	 * navigating, but the layout only learns that through an effect, which has not run by
	 * the time the navigation is attempted. This says it directly.
	 */
	clearDirty: () => void;
	visited: readonly ConsortiumSetupStepId[];
	markVisited: (id: ConsortiumSetupStepId) => void;
}

export const SetupRunContext = createContext<SetupRunValue | undefined>(
	undefined,
);

/**
 * Read by the layout, to decide whether leaving needs a warning.
 *
 * A probe rather than a boolean, deliberately - see the note on the interface. Returning
 * the value would reintroduce the snapshot this exists to avoid.
 */
export function useSetupDirty(): () => boolean {
	const context = useContext(SetupRunContext);
	return useCallback(() => context?.isDirtyNow() ?? false, [context]);
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
export function useSetupRunActions(): Pick<
	SetupRunValue,
	"markVisited" | "clearDirty"
> {
	const context = useContext(SetupRunContext);

	return {
		markVisited: context?.markVisited ?? (() => {}),
		clearDirty: context?.clearDirty ?? (() => {}),
	};
}
