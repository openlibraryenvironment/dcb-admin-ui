import { useMemo, useState, type ReactNode } from "react";

import { SetupDirtyContext, type SetupDirtyValue } from "./setupDirty";

/** Holds the unsaved-work flags for the chapter frame. See ./setupDirty for the why. */
export default function SetupDirtyProvider({
	children,
}: {
	children: ReactNode;
}) {
	// A map rather than a boolean: a chapter can hold more than one form, and the last
	// one to report must not overwrite what another is still saying.
	const [dirtyById, setDirtyById] = useState<Record<string, boolean>>({});

	const value = useMemo<SetupDirtyValue>(
		() => ({
			isDirty: Object.values(dirtyById).some(Boolean),
			register: (id, dirty) =>
				setDirtyById((current) =>
					current[id] === dirty ? current : { ...current, [id]: dirty },
				),
			unregister: (id) =>
				setDirtyById((current) => {
					if (!(id in current)) {
						return current;
					}

					const next = { ...current };
					delete next[id];
					return next;
				}),
		}),
		[dirtyById],
	);

	return (
		<SetupDirtyContext.Provider value={value}>
			{children}
		</SetupDirtyContext.Provider>
	);
}
