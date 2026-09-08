import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";

import type { ConsortiumSetupStepId } from "@helpers/consortiumSetup";
import { SetupRunContext, type SetupRunValue } from "./setupRun";

/** Holds the per-run setup state. See ./setupRun for what it is and why none of it lasts. */
export default function SetupRunProvider({
	children,
}: {
	children: ReactNode;
}) {
	// A map rather than a boolean: a chapter can hold more than one form, and the last
	// one to report must not overwrite what another is still saying.
	//
	// A REF rather than state, because the only reader is a guard that asks at the instant
	// a navigation is attempted - see ./setupRun. State would answer with the value from
	// before the save that has just happened.
	const dirtyById = useRef<Record<string, boolean>>({});
	const [visited, setVisited] = useState<ConsortiumSetupStepId[]>([]);

	const markVisited = useCallback((id: ConsortiumSetupStepId) => {
		setVisited((current) =>
			current.includes(id) ? current : [...current, id],
		);
	}, []);

	const registerDirty = useCallback((id: string, dirty: boolean) => {
		dirtyById.current[id] = dirty;
	}, []);

	const unregisterDirty = useCallback((id: string) => {
		delete dirtyById.current[id];
	}, []);

	const clearDirty = useCallback(() => {
		dirtyById.current = {};
	}, []);

	const isDirtyNow = useCallback(
		() => Object.values(dirtyById.current).some(Boolean),
		[],
	);

	const value = useMemo<SetupRunValue>(
		() => ({
			isDirtyNow,
			registerDirty,
			unregisterDirty,
			clearDirty,
			visited,
			markVisited,
		}),
		[
			isDirtyNow,
			registerDirty,
			unregisterDirty,
			clearDirty,
			visited,
			markVisited,
		],
	);

	return (
		<SetupRunContext.Provider value={value}>
			{children}
		</SetupRunContext.Provider>
	);
}
