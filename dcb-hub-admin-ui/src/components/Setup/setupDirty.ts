import { createContext, useContext, useEffect } from "react";

/**
 * Whether the chapter on screen has edits that have not been saved yet.
 *
 * <h2>Why a context and not a store</h2>
 *
 * The dirty flag lives in each chapter's react-hook-form; the thing that has to act on it —
 * the navigation blocker and the exit button — lives in the layout above them. That is a
 * parent/child relationship inside one route, which is what context is for. A Zustand store
 * would make it global state that outlives the route, and a stale `true` in it would block
 * navigation somewhere else entirely.
 *
 * <h2>Registered, not set</h2>
 *
 * Chapters call {@link useRegisterSetupDirty} with their current `formState.isDirty` and it
 * clears itself on unmount. A chapter that forgets to reset the flag on the way out cannot
 * therefore leave the flow permanently blocked, which is the failure mode that makes people
 * disable a guard like this.
 *
 * The provider component lives in its own file: a module that exports both a component and
 * a hook breaks fast refresh, and eslint says so.
 */
export interface SetupDirtyValue {
	isDirty: boolean;
	register: (id: string, dirty: boolean) => void;
	unregister: (id: string) => void;
}

export const SetupDirtyContext = createContext<SetupDirtyValue | undefined>(
	undefined,
);

/** Read by the layout, to decide whether leaving needs a warning. */
export function useSetupDirty(): boolean {
	return useContext(SetupDirtyContext)?.isDirty ?? false;
}

/**
 * Called by a chapter with its own unsaved state.
 *
 * Safe outside the provider — it simply does nothing — so a chapter can be rendered in a
 * test without dragging the whole layout in.
 */
export function useRegisterSetupDirty(id: string, isDirty: boolean) {
	const context = useContext(SetupDirtyContext);
	const register = context?.register;
	const unregister = context?.unregister;

	useEffect(() => {
		register?.(id, isDirty);
	}, [register, id, isDirty]);

	// Separate effect so the cleanup depends only on the id, not on the dirty flag -
	// otherwise every keystroke would unregister and re-register, and the map would
	// briefly read clean in between.
	useEffect(() => () => unregister?.(id), [unregister, id]);
}
