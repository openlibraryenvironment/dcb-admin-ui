import { useEffect } from "react";
import { useBlocker } from "@tanstack/react-router";

export function useUnsavedChangesWarning(
	isDirty: boolean,
	onKeepEditing?: () => void,
	onLeaveWithoutSaving?: () => void,
) {
	const { proceed, reset, status } = useBlocker({
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
		handleKeepEditing: () => {
			onKeepEditing?.();
			reset?.();
		},
		handleLeaveWithoutSaving: () => {
			onLeaveWithoutSaving?.();
			proceed?.();
		},
	};
}
