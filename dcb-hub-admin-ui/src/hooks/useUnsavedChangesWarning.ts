import { useEffect } from "react";
import { useBlocker } from "@tanstack/react-router";

export function useUnsavedChangesWarning(isDirty: boolean) {
	const { proceed, reset, status, next } = useBlocker({
		shouldBlockFn: () => isDirty,
		withResolver: true,
	});

	useEffect(() => {
		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			if (isDirty) {
				event.preventDefault();
				event.returnValue = "";
			}
		};

		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => window.removeEventListener("beforeunload", handleBeforeUnload);
	}, [isDirty]);

	return {
		showUnsavedChangesModal: status === "blocked",
		handleKeepEditing: () => reset?.(),
		handleLeaveWithoutSaving: () => proceed?.(),
	};
}
