import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter } from "next/router";

interface UseUnsavedChangesWarningProps {
	isDirty: boolean;
	hasValidationError: boolean;
	onKeepEditing: () => void;
	onLeaveWithoutSaving: () => void;
}

const useUnsavedChangesWarning = ({
	isDirty,
	onKeepEditing,
	onLeaveWithoutSaving,
	hasValidationError,
}: UseUnsavedChangesWarningProps) => {
	const router = useRouter();
	const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
	const [nextRoute, setNextRoute] = useState<string | null>(null);
	const navigationInProgress = useRef(false);

	const handleBeforeUnload = useCallback(
		(event: BeforeUnloadEvent) => {
			if (isDirty) {
				event.preventDefault();
				event.returnValue = "";
			}
		},
		[isDirty],
	);

	useEffect(() => {
		const handleRouteChange = (url: string) => {
			if (
				isDirty &&
				!hasValidationError &&
				url !== router.asPath &&
				!navigationInProgress.current
			) {
				setNextRoute(url);
				setShowUnsavedChangesModal(true);
				router.events.emit("routeChangeError");
				throw "routeChange aborted to show dialog";
			}
		};

		const handleBeforePopState = () => {
			if (isDirty && !hasValidationError && !navigationInProgress.current) {
				setNextRoute(window.location.pathname);
				setShowUnsavedChangesModal(true);
				return false;
			}
			return true;
		};

		window.addEventListener("beforeunload", handleBeforeUnload);
		router.events.on("routeChangeStart", handleRouteChange);
		router.beforePopState(handleBeforePopState);

		return () => {
			window.removeEventListener("beforeunload", handleBeforeUnload);
			router.events.off("routeChangeStart", handleRouteChange);
			router.beforePopState(() => true);
		};
	}, [isDirty, router, handleBeforeUnload, hasValidationError]);

	const handleKeepEditing = useCallback(() => {
		setShowUnsavedChangesModal(false);
		setNextRoute(null);
		onKeepEditing();
	}, [onKeepEditing]);

	const handleLeaveWithoutSaving = useCallback(() => {
		setShowUnsavedChangesModal(false);
		if (nextRoute) {
			navigationInProgress.current = true;
			router.push(nextRoute).then(() => {
				navigationInProgress.current = false;
			});
		}
		onLeaveWithoutSaving();
	}, [nextRoute, router, onLeaveWithoutSaving]);

	return {
		showUnsavedChangesModal,
		handleKeepEditing,
		handleLeaveWithoutSaving,
	};
};

export default useUnsavedChangesWarning;
