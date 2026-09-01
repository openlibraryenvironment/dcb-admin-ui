import { useCallback, useMemo, useState, type ReactNode } from "react";

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
	const [dirtyById, setDirtyById] = useState<Record<string, boolean>>({});
	const [visited, setVisited] = useState<ConsortiumSetupStepId[]>([]);

	const markVisited = useCallback((id: ConsortiumSetupStepId) => {
		setVisited((current) =>
			current.includes(id) ? current : [...current, id],
		);
	}, []);

	const registerDirty = useCallback((id: string, dirty: boolean) => {
		setDirtyById((current) =>
			current[id] === dirty ? current : { ...current, [id]: dirty },
		);
	}, []);

	const unregisterDirty = useCallback((id: string) => {
		setDirtyById((current) => {
			if (!(id in current)) {
				return current;
			}

			const next = { ...current };
			delete next[id];
			return next;
		});
	}, []);

	const value = useMemo<SetupRunValue>(
		() => ({
			isDirty: Object.values(dirtyById).some(Boolean),
			registerDirty,
			unregisterDirty,
			visited,
			markVisited,
		}),
		[dirtyById, registerDirty, unregisterDirty, visited, markVisited],
	);

	return (
		<SetupRunContext.Provider value={value}>
			{children}
		</SetupRunContext.Provider>
	);
}
